$(document).ready(function(){
    window.chat = createChatController();
    window.chat.loadUser();
});

function createChatController(){
    var user = {
        key: null,
        name: null,
        dtConnection: null
    }

    return {
        state : user,
        connection: null,
        loadUser: function(){
            this.state.name =  prompt('Digite seu nome para entrar no chat', 'Usuário');
            this.state.key = new Date().valueOf();
            this.state.dtConnection = new Date();
            this.connectUserToChat();
        },
        connectUserToChat: function(){
            startConnection(this);
        },
        sendMessage: function(to){
            var chatMessage = {
                sender: this.state,
                message: to.message,
                destination: to.destination
            };

            this.connection.invoke("SendMessage", (chatMessage))
                                  .catch(err => console.log(x = err));
            
            insertMessage(chatMessage.destination, 'me', chatMessage.message);
            to.field.val('').focus();
        },
        onReceiveMessage: function() {
            this.connection.on("Receive", (sender, message) => {
                openChat(null, sender, message);
            });
        }
    };
}

async function startConnection(chat) {
    try {

        chat.connection = new signalR.HubConnectionBuilder().withUrl("/chat?user=" + JSON.stringify(window.chat.state)).build();
        await chat.connection.start();

            loadChat(chat.connection);

            chat.connection.onclose(async () => {
               await startConnection(chat);
            });

            chat.onReceiveMessage();

    } catch (err) {
        setTimeout(() => startConnection(chat.connection), 5000);
    }
};

async function loadChat(connection){
    connection.on('chat', (users, user) => {
        const listUsers = (data) => {
            return users.map((u) => {
             if(!checkIfElementExist(u.key, 'id') && u.key != window.chat.state.key)
             return (
              `
              <section class="user box_shadow_0" onclick="openChat(this)" data-id="${ u.key }" data-name="${ u.name }">
              <span class="user_icon">${ u.name.charAt(0) }</span>
              <p class="user_name"> ${ u.name } </p>
              <span class="user_date"> ${ new Date(u.dtConnection).toLocaleDateString() }</span>
              </section>
              `
             )
            }).join('')
           }

           $('.main').append(listUsers);
    });
}

function openChat(e, sender, message){

    var user = { 
        id: e ? $(e).data('id') : sender.key,
        name: e ? $(e).data('name') : sender.name
    }
    
    if(!checkIfElementExist(user.id, 'chat'))
    {
        const chat = 
        `
        <section class="chat" data-chat="${ user.id }">
        <header>
            ${ user.name }
        </header>
        <main>
        </main>
        <footer>
            <input type="text" placeholder="Digite aqui sua mensagem" data-chat="${ user.id }">
            <a onclick="sendMessage(this)" data-chat="${ user.id }">Enviar</a>
        </footer>
        </section>
        `

        $('.chats_wrapper').append(chat);
    }
    if(sender && message)
        insertMessage(sender.key, 'their', message);
}

function insertMessage(target, who, message){
    const chatMessage = `
    <div class="message ${who}">${ message } <span>${ new Date().toLocaleTimeString() }</span></div>
    `;
    $(`section[data-chat="${ target }"]`).find('main').append(chatMessage);
}

function sendMessage(e){

    var input ={
        destination: $(e).data('chat'),
        field: $(`input[data-chat="${$(e).data('chat')}"]`),
        message: $(`input[data-chat="${$(e).data('chat')}"]`).val()
    }

    window.chat.sendMessage(input);
}

function checkIfElementExist(id, data){
    return $('section[data-'+data+'="'+id+'"]') && $('section[data-'+data+'="'+id+'"]').length > 0;
}