const emialRegex = require("../utils/regexes").emialRegex;
const passwordRegex = require("../utils/regexes").passwordRegex;

const emailMessage = "Wrong email format. Example of right email format: email@example.com";
const passwordMessage = "Password must be between 8 and 32 characters and must include at least one number, lowercase and upper case letter.";
const nameMessage = "name must be at least 2 characters long.";


const validateRegistration = (firstName, lastName, email, password, confirmPassword) => {
    const eMessages = [];
    
    if(firstName.length < 2){
        eMessages.push("First " + nameMessage);
    }

    if(lastName.length < 2){
        eMessages.push("Last " + nameMessage);
    }
    
    if(!email.match(emialRegex)){
        eMessages.push(emailMessage);
    }

    if(password === confirmPassword && !password.match(passwordRegex)){
        eMessages.push(passwordMessage);
    }

    return eMessages;
}

const validateLogin = (email, password) => {
    const eMessages = [];
    
    if(!email.match(emialRegex)){
        eMessages.push(emailMessage);
    }

    if(!password.match(passwordRegex)){
        eMessages.push(passwordMessage);
    }

    return eMessages;
}

module.exports = {validateLogin, validateRegistration};




