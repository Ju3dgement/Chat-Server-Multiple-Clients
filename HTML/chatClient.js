//connect to server and retain the socket
//connect to same host that served the document

//const socket = io('http://' + window.document.location.host)
const socket = io() //by default connects to same server that served the page

socket.on('serverSays', function(text_message, color) {
  // Print the message to the console with a color depending on requirements
  let msgDiv = document.createElement('div')
  msgDiv.textContent = text_message
  msgDiv.style.color = color
  document.getElementById('messages').appendChild(msgDiv)
})

function sendMessage() {
  if (document.getElementById('nameBox').disabled){
    let message = document.getElementById('msgBox').value.trim()
    if(message === '') return //do nothing

    //Split everything on the left side of : and right side of :, then split via , to create a list
    let privateUsers = null
    if (message.includes(":")) {
      let [users, content] = message.split(":")
      privateUsers = users.split(",")
      for (let i = 0; i < privateUsers.length; i++)
        privateUsers[i] = privateUsers[i].replaceAll(" ", "")
      // console.log(privateUsers)
      message = content
    }
    if(privateUsers === null){ //public message
      socket.emit('clientSays', message)
    } else { //private message
      socket.emit('Private_Client', document.getElementById('nameBox').value,  message,  privateUsers)
    }
    document.getElementById('msgBox').value = ''
  } 
}

function approve_name(userName){ 
  //Check if the username is valid based on R1.3 requirements by using ascii values
  let first_letter_ascii = userName.charCodeAt(0) //Gets first ascii value of the username
  if ((first_letter_ascii >= 65 && first_letter_ascii <= 90) || (first_letter_ascii >= 97 && first_letter_ascii <= 122)){//If the first character is not a lower/upper case letter
    for (let i = 0; i < userName.length; i++){ //Checks the rest of the characters
      let charCode = userName.charCodeAt(i);
      if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || (charCode >= 48 && charCode <= 57)){  // A-Z, a-z, 0-9 allowed only
        continue
      }
      else{
        return false
      }
    }
  } else{
    return false
  }
  return true //Bypasses all checkers
}

function connect_user_server() {
  //Connects user to server once name has been approved
  let userName = document.getElementById('nameBox').value.trim()
  if(userName === '') return //do nothing
  if (approve_name(userName) === true){
    socket.emit('connect_user_server', userName)
    document.getElementById('nameBox').disabled = true
    document.getElementById('connect_as_button').disabled = true
    document.getElementById('messages').firstChild.textContent = "Connected User: " + userName
    console.log('User name: ' + userName)
  } else{
    document.getElementById('nameBox').value = ''
    document.getElementById('messages').firstChild.textContent = "Please enter a valid username, first character must be a letter and the rest of the characters must be letters or numbers, no spaces too"
  }
}

function handleKeyDown(event) {
  //Handle the enter key from messages
  const ENTER_KEY = 13 //keycode for enter key
  if (event.keyCode === ENTER_KEY) {
    sendMessage()
    return false //don't propogate event
  }
}


counter = 1 //Counter for how many times the client has cleared the chat
function clear_client(){
  //Clears the client screen
  console.log("Clearing client")  
  message_delete = document.getElementById('messages')
  try{
    while(message_delete.lastChild != message_delete.firstChild){ //Clear everything beside the text after messages
      message_delete.removeChild(message_delete.lastChild)
    }
  } catch{
    //There is some error that shows up when I press f12 this is so it doesnt show
  }
  if (document.getElementById('nameBox').disabled === true){ //Organization purposes
    document.getElementById('messages').firstChild.textContent = 'Connected User: ' + document.getElementById('nameBox').value + ' (Chat Cleared x' + counter + ')'
    counter += 1
  }
}

function disconnect_user(){
  //User manually disonnects from the server via button, reset everything
  if (document.getElementById('nameBox').disabled === true){
    document.getElementById('nameBox').disabled = false
    document.getElementById('connect_as_button').disabled = false
    document.getElementById('messages').firstChild.textContent = "Enter a username to start chatting"
    document.getElementById('nameBox').value = ''
    socket.emit('disconnect_manually')
  }
}

//Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  //This function is called after the browser has loaded the web page

  //add listener to buttons
  document.getElementById('send_button').addEventListener('click', sendMessage)
  document.getElementById('connect_as_button').addEventListener('click', connect_user_server)
  document.getElementById('disconnect_chat').addEventListener('click', disconnect_user)
  document.getElementById('chat_clear').addEventListener('click', clear_client)
  document.addEventListener('keydown', handleKeyDown)
})

