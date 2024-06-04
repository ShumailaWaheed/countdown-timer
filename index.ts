import inquirer from 'inquirer';
import notifier from 'node-notifier';
import chalk from 'chalk';

// Function to format time as HH:MM:SS
function formatTime(seconds: number): string {
    const hrs: number = Math.floor(seconds / 3600);
    const mins: number = Math.floor((seconds % 3600) / 60);
    const secs: number = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Function to get the current date and time as YYYY-MM-DD HH:MM:SS
function getCurrentDateTime(): string {
    let date_ob = new Date();

    // current date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = ("0" + date_ob.getHours()).slice(-2);

    // current minutes
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);

    // current seconds
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);

    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

let interval: NodeJS.Timeout | null = null;
let paused = false;
let remainingSeconds: number;
let loopCount: number;
let currentLoop: number = 0;
let messages: { time: number, message: string }[] = [];

// Function to run the countdown
function countdown(seconds: number): void {
    remainingSeconds = seconds;

    const runCountdown = () => {
        if (remainingSeconds > 0) {
            const message = messages.find(msg => msg.time === remainingSeconds);
            if (message) {
                console.log(chalk.yellow(`Message: ${message.message}`));
            }
            console.log(chalk.green
                (`Remaining time: ${formatTime(remainingSeconds)} | Current Date and Time: ${getCurrentDateTime()}`));
            remainingSeconds--;
        } else {
            clearInterval(interval!);
            notifier.notify('Countdown complete!');
            console.log(chalk.blue('Countdown complete!'));
            if (currentLoop < loopCount - 1) {
                currentLoop++;
                countdown(seconds); // Restart the countdown
            }
        }
    };

    interval = setInterval(runCountdown, 1000);
}

// Function to handle user actions
function promptActions() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select an action:',
            choices: ['Pause', 'Resume', 'Cancel', 'Exit']
        }
    ]).then((answers: any) => {
        switch (answers.action) {
            case 'Pause':
                if (interval && !paused) {
                    clearInterval(interval);
                    paused = true;
                    console.log(chalk.magenta('Countdown paused.'));
                }
                break;
            case 'Resume':
                if (paused) {
                    countdown(remainingSeconds);
                    paused = false;
                    console.log(chalk.magenta('Countdown resumed.'));
                }
                break;
            case 'Cancel':
                if (interval) {
                    clearInterval(interval);
                    console.log(chalk.red('Countdown cancelled.'));
                }
                break;
            case 'Exit':
                if (interval) {
                    clearInterval(interval);
                }
                console.log(chalk.red('Exiting.'));
                process.exit();
                break;
        }
        if (answers.action !== 'Exit') {
            promptActions();
        }
    });
}

// Prompt the user for countdown details
inquirer.prompt([
    {
        type: 'input',
        name: 'seconds',
        message: 'Enter the number of seconds for the countdown:',
        validate: (input: string) => {
            const value = parseInt(input);
            return !isNaN(value) && value > 0 ? true : 'Please enter a valid number of seconds.';
        }
    },
    {
        type: 'input',
        name: 'loops',
        message: 'Enter the number of loops (repeats) for the countdown:',
        validate: (input: string) => {
            const value = parseInt(input);
            return !isNaN(value) && value >= 0 ? true : 'Please enter a valid number of loops.';
        }
    },
    {
        type: 'input',
        name: 'messages',
        message: 'Enter messages in the format "time:message" separated by commas (e.g., "30:Halfway there,10:Almost done"):',
        filter: (input: string) => {
            return input.split(',').map(item => {
                const [time, message] = item.split(':');
                return { time: parseInt(time), message };
            });
        }
    }

]).then((answers: any) => {
    const seconds: number = parseInt(answers.seconds);
    loopCount = parseInt(answers.loops);
    messages = answers.messages;
    countdown(seconds);
    promptActions();
});

