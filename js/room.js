let messageContainer = document.getElementById("messages");
messageContainer.scrollTop = messageContainer.scrollHeight;
import { APP_ID } from "./env.js";

console.log(APP_ID);
let appID = APP_ID;
let token = null;
let uid = String(Math.floor(Math.random() * 230));
let urlParams = new URLSearchParams(window.location.search);
let room = urlParams.get("room");
let displayName = sessionStorage.getItem("display_name");


if(room === null || displayName === null){
  window.location = `join.html?room=${room}`
}


let initiate = async () => {
  let rtmClient = await AgoraRTM.createInstance(appID);
  await rtmClient.login({uid, token });

  const channel = await rtmClient.createChannel(room);
  await channel.join();

  await rtmClient.addOrUpdateLocalUserAttributes({'name': displayName})
  channel.on("MemberLeft", async (memberId) => {
    removeParticipantFromDom(memberId);
  });
  channel.on("MemberJoined", async (memberId) => {
    addParticipantToDom(memberId);
  });
  channel.on("ChannelMessage", (messageData, memberId) => {
    let data = JSON.parse(messageData.text);
    addMessageToDom(data.message, memberId);
  });

  let addParticipantToDom = (memberId) => {
    let membersWrapper = document.getElementById("participants_container");
    let memberItem = `<div id=member_${memberId}_wrapper class="member_wrapper">
                      <span class="green_dot"></span>
                      <P>${memberId}</P>
                      </div>`;
    // membersWrapper.insertAdjacentHTML("beforeend", memberItem);
    membersWrapper.innerHTML += memberItem;
  };

  let removeParticipantFromDom = async (memberId) => {
    document.getElementById(`member_${memberId}_wrapper`).remove();  
  };

  let addMessageToDom = (messageData, memberId) => {
    let messagesWrapper = document.getElementById("messages");
    let messageItem = `<div class="message_wrapper">
                        <p>${memberId}</p>
                        <p class="message">${messageData}</p>
                        </div>`;

    messagesWrapper.insertAdjacentHTML("beforeend", messageItem);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  };

  let sendMessage = async (e) => {
    e.preventDefault();
    let message = e.target.message.value;
    channel.sendMessage({ text: JSON.stringify({ message: message }) });
    addMessageToDom(message, uid);
    e.target.reset();
  };

  
  let leave = async () => {
    await channel.leave();
    await rtmClient.logout();
  };

  window.addEventListener("beforeunload", leave);
  let getParticipants = async () => {
    let participants = await channel.getMembers();
    for (let i = 0; i < participants.length; i++) {
      addParticipantToDom(participants[i]);
    }
  };

  getParticipants();

  let messageForm = document.getElementById("message_form");
  messageForm.addEventListener("submit", sendMessage);
};
initiate();
