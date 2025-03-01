/**
 * Affiliate Model
 * 
 * This module provides functions for handling affiliate program data.
 * It integrates with the User model to store affiliate information.
 */

const { User } = require('./index');
const crypto = require('crypto');

class Affiliate {
    /**
     * Get affiliate data for a user
     * @param {string} telegramId - Telegram user ID
     * @returns {Promise<Object>} Affiliate data
     */
    static async getAffiliateData(telegramId) {
        try {
            // Find user by telegramId
            let user = await User.findOne({ telegramId: telegramId.toString() });
            
            if (!user) {
                // Return default data for non-existent users
                return {
                    telegramId,
                    referralCode: this.generateReferralCode(telegramId),
                    referrals: 0,
                    earnings: 0
                };
            }
            
            // Create referral code if not exists
            if (!user.affiliate.referralCode) {
                user.affiliate.referralCode = this.generateReferralCode(telegramId);
                await user.save();
            }
            
            // Return affiliate data
            return {
                telegramId: user.telegramId,
                referralCode: user.affiliate.referralCode,
                referrals: user.affiliate.referralCount,
                earnings: user.affiliate.bonusCoins
            };
        } catch (error) {
            console.error('Error getting affiliate data:', error);
            return null;
        }
    }
    
    /**
     * Process a referral
     * @param {string} referralCode - Referral code
     * @param {string} newUserId - New user's Telegram ID
     * @param {string} newUsername - New user's username
     * @returns {Promise<Object>} Processing result
     */
    static async processReferral(referralCode, newUserId, newUsername) {
        try {
            // Find referrer by referral code
            const referrer = await User.findOne({ 'affiliate.referralCode': referralCode });
            
            if (!referrer) {
                return { success: false, message: 'Invalid referral code' };
            }
            
            // Find new user
            let newUser = await User.findOne({ telegramId: newUserId.toString() });
            
            // If user doesn't exist, we can't process the referral yet
            if (!newUser) {
                return { success: false, message: 'User not found' };
            }
            
            // Check if this user has already been referred
            if (newUser.affiliate.referrerId) {
                return { success: false, message: 'User already referred' };
            }
            
            // Update new user with referrer information
            newUser.affiliate.referrerId = referrer.telegramId;
            
            // Reward: 25 bonus coins for new user
            newUser.coins += 25;
            
            await newUser.save();
            
            // Update referrer stats
            referrer.affiliate.referralCount += 1;
            
            // Reward: 50 bonus coins for referrer
            referrer.affiliate.bonusCoins += 50;
            referrer.coins += 50;
            
            await referrer.save();
            
            return { 
                success: true, 
                message: 'Referral processed successfully',
                affiliate: {
                    telegramId: referrer.telegramId,
                    referralCode: referrer.affiliate.referralCode,
                    referrals: referrer.affiliate.referralCount,
                    earnings: referrer.affiliate.bonusCoins
                }
            };
        } catch (error) {
            console.error('Error processing referral:', error);
            return { success: false, message: 'Error processing referral' };
        }
    }
    
    /**
     * Generate a unique referral code
     * @param {string} telegramId - Telegram user ID
     * @returns {string} Referral code
     */
    static generateReferralCode(telegramId) {
        const prefix = telegramId.toString().slice(0, 5);
        const randomBytes = crypto.randomBytes(4).toString('hex');
        return `${prefix}-${randomBytes}`;
    }
}

module.exports = Affiliate; 