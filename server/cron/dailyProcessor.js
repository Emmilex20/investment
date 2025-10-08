// server/cron/dailyProcessor.js
import cron from 'node-cron';
import Investment from '../models/Investment.js';
import User from '../models/User.js';

// --- Core Logic for Processing Returns ---
const processDailyReturns = async () => {
    console.log('--- CRON JOB START: Processing Daily Returns ---');
    
    // 1. Find all active investments that are due for a return
    // We check if the last return date was before today
    const investmentsDue = await Investment.find({
        status: 'active',
        lastReturnDate: { $lt: new Date() } // Find investments where the last return was before the start of today
    }).populate('package', 'dailyReturnRate durationDays'); // Get rate and duration

    if (investmentsDue.length === 0) {
        console.log('No active investments due for returns today.');
        return;
    }

    console.log(`Processing ${investmentsDue.length} investments...`);

    for (const investment of investmentsDue) {
        try {
            const pkg = investment.package;
            
            // Check if investment is already completed
            if (investment.currentDay >= pkg.durationDays) {
                investment.status = 'completed';
                await investment.save();
                continue; // Move to the next investment
            }

            // Calculate daily return amount
            const dailyReturn = investment.investedAmount * pkg.dailyReturnRate;
            
            // 2. Update user's balance
            const user = await User.findById(investment.user);
            if (!user) {
                console.error(`User not found for investment ID: ${investment._id}`);
                continue;
            }

            user.piCoinsBalance += dailyReturn;
            await user.save();
            
            // 3. Update the investment record
            investment.totalReturns += dailyReturn;
            investment.currentDay += 1;
            investment.lastReturnDate = new Date(); // Set to now (today)

            // 4. Check for final completion
            if (investment.currentDay >= pkg.durationDays) {
                investment.status = 'completed';
                console.log(`Investment ${investment._id} COMPLETED.`);
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
 * @desc Schedules the daily processor to run every day at a specific time (e.g., 00:01 AM).
 * NOTE: In a real environment, you might run this less often for simulation, e.g., every minute.
 * Using '0 1 * * *' (1 minute past midnight) to simulate a daily run.
 */
const startCronJob = () => {
    // Cron expression: minute hour dayOfMonth month dayOfWeek
    // '*/1 * * * *' runs every minute (for easy local testing)
    // '0 1 * * *' runs every day at 1:00 AM
    
    // We will use every minute for easy testing, but log it as a 'daily' processor
    cron.schedule('*/1 * * * *', () => { 
        processDailyReturns();
    });
    
    console.log('Daily Return Processor CRON Job scheduled (runs every minute for testing).');
};

export default startCronJob;