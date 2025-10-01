const mongoose = require('mongoose');
const User = require('../models/User');
const TentativeSlot = require('../models/TentativeSlot');
const SuggestedSlot = require('../models/SuggestedSlot');

/**
 * Settings-driven cleanup service that respects user data retention preferences
 */
class CleanupService {
  
  /**
   * Run cleanup for all users based on their individual data retention settings
   */
  static async runCleanupForAllUsers() {
    console.log('🧹 Starting cleanup service for all users...');
    
    try {
      // Get all users with their data retention settings
      const users = await User.find({}, {
        googleId: 1,
        email: 1,
        'advanced.dataRetention': 1
      });
      
      console.log(`🔍 Found ${users.length} users to process`);
      
      const results = {
        totalUsers: users.length,
        processedUsers: 0,
        cleanedSlots: 0,
        errors: []
      };
      
      for (const user of users) {
        try {
          const userResult = await this.runCleanupForUser(user.googleId, user.advanced?.dataRetention);
          results.processedUsers++;
          results.cleanedSlots += userResult.cleanedSlots;
          
          console.log(`✅ Cleaned ${userResult.cleanedSlots} items for user ${user.email}`);
        } catch (error) {
          console.error(`❌ Cleanup failed for user ${user.email}:`, error.message);
          results.errors.push({
            userId: user.googleId,
            email: user.email,
            error: error.message
          });
        }
      }
      
      console.log('🏁 Cleanup service completed:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Cleanup service failed:', error);
      throw error;
    }
  }
  
  /**
   * Run cleanup for a specific user based on their data retention setting
   */
  static async runCleanupForUser(userId, dataRetentionDays = 365) {
    console.log(`🧹 Running cleanup for user ${userId}, retention: ${dataRetentionDays} days`);
    
    // If dataRetention is -1, keep forever (no cleanup)
    if (dataRetentionDays === -1) {
      console.log(`⏭️ User has forever retention, skipping cleanup`);
      return { cleanedSlots: 0, keptSlots: 'all' };
    }
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dataRetentionDays);
    
    console.log(`📅 Cleaning data older than: ${cutoffDate.toISOString()}`);
    
    let cleanedCount = 0;
    
    // Clean up old TentativeSlots
    const tentativeResult = await TentativeSlot.deleteMany({
      userId: userId,
      createdAt: { $lt: cutoffDate },
      status: { $in: ['expired', 'cancelled'] } // Only clean up expired/cancelled, keep confirmed
    });
    
    cleanedCount += tentativeResult.deletedCount;
    console.log(`🗑️ Deleted ${tentativeResult.deletedCount} old tentative slots`);
    
    // Clean up old SuggestedSlots
    const suggestedResult = await SuggestedSlot.deleteMany({
      userId: userId,
      createdAt: { $lt: cutoffDate },
      status: { $in: ['expired', 'cleared'] } // Keep active suggestions
    });
    
    cleanedCount += suggestedResult.deletedCount;
    console.log(`🗑️ Deleted ${suggestedResult.deletedCount} old suggested slots`);
    
    // Also clean up expired slots regardless of date if they're very old
    const veryOldDate = new Date();
    veryOldDate.setDate(veryOldDate.getDate() - Math.max(dataRetentionDays * 2, 730)); // 2x retention or 2 years max
    
    const expiredCleanup = await TentativeSlot.deleteMany({
      userId: userId,
      'timeSlot.end': { $lt: new Date() }, // Past events
      createdAt: { $lt: veryOldDate },
      status: 'confirmed'
    });
    
    cleanedCount += expiredCleanup.deletedCount;
    console.log(`🗑️ Deleted ${expiredCleanup.deletedCount} very old confirmed slots`);
    
    return {
      cleanedSlots: cleanedCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: dataRetentionDays
    };
  }
  
  /**
   * Clean up expired slots immediately (regardless of data retention)
   */
  static async cleanupExpiredSlots() {
    console.log('⏰ Cleaning up expired slots...');
    
    const now = new Date();
    
    // Mark expired TentativeSlots
    const expiredTentative = await TentativeSlot.updateMany(
      {
        'timeSlot.end': { $lt: now },
        status: 'confirmed'
      },
      {
        status: 'expired'
      }
    );
    
    console.log(`⌛ Marked ${expiredTentative.modifiedCount} tentative slots as expired`);
    
    // Clean up very old expired SuggestedSlots (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const oldSuggested = await SuggestedSlot.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
      status: { $in: ['expired', 'cleared'] }
    });
    
    console.log(`🗑️ Deleted ${oldSuggested.deletedCount} old suggested slots`);
    
    return {
      expiredTentative: expiredTentative.modifiedCount,
      deletedSuggested: oldSuggested.deletedCount
    };
  }
  
  /**
   * Get cleanup statistics for a user
   */
  static async getCleanupStats(userId) {
    const user = await User.findOne({ googleId: userId });
    const dataRetention = user?.advanced?.dataRetention || 365;
    
    let cutoffDate = null;
    if (dataRetention !== -1) {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dataRetention);
    }
    
    const stats = {
      dataRetentionDays: dataRetention,
      cutoffDate: cutoffDate?.toISOString() || null,
      cleanupEnabled: dataRetention !== -1
    };
    
    if (cutoffDate) {
      // Count items that would be cleaned up
      const [tentativeCount, suggestedCount] = await Promise.all([
        TentativeSlot.countDocuments({
          userId: userId,
          createdAt: { $lt: cutoffDate },
          status: { $in: ['expired', 'cancelled'] }
        }),
        SuggestedSlot.countDocuments({
          userId: userId,
          createdAt: { $lt: cutoffDate },
          status: { $in: ['expired', 'cleared'] }
        })
      ]);
      
      stats.itemsToCleanup = tentativeCount + suggestedCount;
    } else {
      stats.itemsToCleanup = 0;
    }
    
    // Count total items
    const [totalTentative, totalSuggested] = await Promise.all([
      TentativeSlot.countDocuments({ userId: userId }),
      SuggestedSlot.countDocuments({ userId: userId })
    ]);
    
    stats.totalItems = totalTentative + totalSuggested;
    
    return stats;
  }
}

module.exports = CleanupService;