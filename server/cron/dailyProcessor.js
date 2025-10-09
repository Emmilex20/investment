// server/cron/dailyProcessor.js
import cron from 'node-cron';
import Investment from '../models/Investment.js';
import User from '../models/User.js';

// --- Core Logic for Processing Returns ---
const processDailyReturns = async () => {
    console.log('--- CRON JOB START: Processing Daily Returns ---');
    
    // Get the start of today (midnight) for accurate comparison
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Find all active investments that are due for a return
    // We check if the last return date was before the start of today
    const investmentsDue = await Investment.find({
        status: 'active',
        lastReturnDate: { $lt: startOfToday } // Find investments where the last return was before today
    }).populate('package', 'dailyReturnRate durationDays'); // Get rate and duration

    if (investmentsDue.length === 0) {
        console.log('No active investments due for returns today.');
        return;
    }

    console.log(`Processing ${investmentsDue.length} investments...`);

    for (const investment of investmentsDue) {
        try {
            const pkg = investment.package;
            
            // Edge case: Check if investment is already completed before processing
            if (investment.currentDay >= pkg.durationDays) {
                investment.status = 'completed';
                await investment.save();
                console.log(`Investment ${investment._id} was due but already met/exceeded duration. Status set to 'completed'.`);
                continue; // Move to the next investment
            }

            // Calculate daily return amount
            const dailyReturn = investment.investedAmount * pkg.dailyReturnRate;
            
            // 2. Update user's balance
            const user = await User.findById(investment.user);
            if (!user) {
                console.error(`CRITICAL: User not found for investment ID: ${investment._id}. Investment skipped.`);
                // Set investment to 'failed' or 'error' status for admin review if user is missing
                continue;
            }

            user.piCoinsBalance += dailyReturn;
            await user.save();
            
            // 3. Update the investment record
            investment.totalReturns += dailyReturn;
            investment.currentDay += 1;
            investment.lastReturnDate = new Date(); // Set to now

            // 4. Check for final completion after crediting the last return
            if (investment.currentDay >= pkg.durationDays) {
                investment.status = 'completed';
                console.log(`Investment ${investment._id} COMPLETED on day ${investment.currentDay}.`);
            }
            
            await investment.save();
            
            console.log(`+${dailyReturn.toFixed(2)} P$ credited to User ${user.email} (Day ${investment.currentDay}/${pkg.durationDays})`);

        } catch (error) {
            console.error(`Error processing investment ${investment._id}:`, error.message);
        }
    }
    
    console.log('--- CRON JOB END: Daily Returns Processed ---');
};

// --- Cron Job Scheduler ---

/**
 * @desc Schedules the daily processor to run every day at 1 minute past midnight (00:01 AM).
 * The cron expression is '0 1 * * *'.
 */
const startCronJob = () => {
    // Cron expression: minute hour dayOfMonth month dayOfWeek
    // '0 1 * * *' runs every day at 1:00 AM
    
    // We are now setting it to run once daily.
    cron.schedule('0 1 * * *', () => { 
        processDailyReturns();
    });
    
    console.log('Daily Return Processor CRON Job scheduled (runs daily at 01:00 AM).');
};

export default startCronJob;