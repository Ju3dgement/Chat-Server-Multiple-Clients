const map_name_id = new Map();
const server = require('http').createServer(handler)
const io = require('socket.io')(server) //wrap server app in socket io capability
const fs = require('fs') //file system to server static files
const url = require('url'); //to parse url strings
const PORT = process.argv[2] || process.env.PORT || 3000 //useful if you want to specify port through environment variable
                                                         //or command-line arguments

const ROOT_DIR = 'html' //dir to serve static files from

const MIME_TYPES = {
  'css': 'text/css', 
  'gif': 'image/gif', 
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'
}

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES['txt']
}

server.listen(PORT) //start http server listening on PORT

function handler(request, response) {
  //handler for http server requests including static files
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })
}

//Socket Server
io.on('connection', function(socket) {
  console.log('client connected')
  socket.emit('serverSays', 'Enter a username to start chatting', "black")
  socket.on('clientSays', function(data) {
  console.log('RECEIVED: ' + data)

  //Find the name of the user from the socket id
  name_user = null
  for (let key_name of map_name_id.keys()){
    if (map_name_id.get(key_name) === socket.id){
      name_user = key_name;
      break
    }
  }

  //Prints the message to every client, blue text for self, black for others
  for(let name of map_name_id.keys()){
    let color = (socket.id === map_name_id.get(name)) ? "blue" : "black";
    io.to(map_name_id.get(name)).emit('serverSays', name_user + ": " + data, color)
    }
  })

  //adds to global map
  socket.on('connect_user_server', function(name) {
    console.log('Connected --> ' + name + ' <--To Chat Server')
    addToRegistry(socket.id, name)
  })

  //Display private messages to the correct users
  socket.on('Private_Client', function(username, message, list_private_map_name_id){
    //The person who send the message
    io.to(map_name_id.get(username)).emit('serverSays', username + ": " + message, "red")
    
    for (let private of list_private_map_name_id){
      if (map_name_id.has(private)){
        // prevents the sender from duplicating on screen messssages
        if (map_name_id.get(username) !== map_name_id.get(private)){
          io.to(map_name_id.get(private)).emit('serverSays', username + ": " + message, "red")
        }
      }
    }
  })

  //user somehow disonnects (usually from refreshing the page)
  socket.on('disconnect', function(){
    //event emitted when a client disconnects
    console.log('client disconnected')
    for (let key_name of map_name_id.keys()){
      if (map_name_id.get(key_name) === socket.id){
        map_name_id.delete(key_name)
        break
      }
    }
    //display to server console
    displayRequestedIDs(Array.from(map_name_id.keys()))
  })

  socket.on('disconnect_manually', function(){ //For some reason I can not call the above function (must be special) so I created a new one
    //event emitted when a client disconnects
    console.log('client disconnected manually from button')
    for (let key_name of map_name_id.keys()){
      if (map_name_id.get(key_name) === socket.id){
        map_name_id.delete(key_name)
        break
      }
    }
    //display to server console
    displayRequestedIDs(Array.from(map_name_id.keys()))
  })
})


//~~~~~~~~~~Map data structure to store the username and socket id~~~~~~~~~~
function addToRegistry(id, name){ 
  //Add a username and id to the map_name_id Map object
  if(!map_name_id.has(name)){
      map_name_id.set(name, id)
  } else {
    console.log("User already exists in the registry")
  }
}

function displayRequestedIDs(listUser){
  //Display the values for each key in the registry object
  console.log("\nList of id in the registry.")
  listUser.forEach((userName) =>{
      if(map_name_id.has(userName)){
          //Maybe you could use this to emit back to the client for any private messages
          console.log("\t" +userName + ": " + map_name_id.get(userName))
      }
  })
}

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:${PORT}/chatClient.html`)
