let messageContainer = document.getElementById("messages");
messageContainer.scrollTop = messageContainer.scrollHeight;
import { APP_ID } from "./env.js";

let appID = APP_ID;
let token = null;
let uid = String(Math.floor(Math.random() * 230));
let urlParams = new URLSearchParams(window.location.search);
let room = urlParams.get("room");
let displayName = sessionStorage.getItem("display_name");

if (room === null || displayName === null) {
  window.location = `join.html?room=${room}`;
}

let initiate = async () => {
  let rtmClient = await AgoraRTM.createInstance(appID);
  await rtmClient.login({ uid, token });

  const channel = await rtmClient.createChannel(room);
  await channel.join();

  await rtmClient.addOrUpdateLocalUserAttributes({ name: displayName });

  channel.on("MemberLeft", async (memberId) => {
    removeParticipantFromDom(memberId);
    let participants = await channel.getMembers();
    updateParticipantTotal(participants);
  });
  channel.on("MemberJoined", async (memberId) => {
    addParticipantToDom(memberId);
    let participants = await channel.getMembers();
    updateParticipantTotal(participants);
  });
  channel.on("ChannelMessage", async (messageData, memberId) => {
    let data = JSON.parse(messageData.text);
    let name = data.displayName;
    addMessageToDom(data.message,name,false);

    let participants = await channel.getMembers();
    updateParticipantTotal(participants);
  });

  let addParticipantToDom = async (memberId) => {
    let { name } = await rtmClient.getUserAttributesByKeys(memberId, ["name"]);

    let membersWrapper = document.getElementById("members");

    let memberItem = `<div id="members_list">
                      <div class="member_wrapper" id="member_${memberId}_wrapper">
                        <span class="green_dot"></span>
                        <p class="member_name">${name}</p>
                      </div>
                    </div>`;
    membersWrapper.innerHTML += memberItem;
  };

  let removeParticipantFromDom = async (memberId) => {
    document.getElementById(`member_${memberId}_wrapper`).remove();
  };

  let addMessageToDom = (messageData,displayName,sender) => {
    let time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    let messagesWrapper = document.getElementById("messages");
    console.log(sender)
    let messageItem = !sender ? 
    `<div class="message_wrapper">
    <img class="avatar_md" src="./images/logo.jpeg" alt="logo" />
    <div class="message_body">
      <strong class="message_author">${displayName}</strong>
      <small class="message_timestamp">${time}</small>
      <p class="message_text">${messageData}</p>
    </div>
  </div>`:
  `<div class="message_wrapper2">
  <img class="avatar_md" src="./images/logo.jpeg" alt="logo" />
  <div class="message_body">
    <strong class="message_author">${displayName}</strong>
    <small class="message_timestamp">${time}</small>
    <p class="message_text">${messageData}</p>
  </div>
</div>`;
    messagesWrapper.insertAdjacentHTML("beforeend", messageItem);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  };

  let sendMessage = async (e) => {
    e.preventDefault();
    let message = e.target.message.value;
    channel.sendMessage({
      text: JSON.stringify({ message: message, displayName: displayName }),
    });
    addMessageToDom(message,displayName,true);
    e.target.reset();
  };

  let updateParticipantTotal = (participants) => {
    let total = document.getElementById("member_count");
    total.innerText = participants.length;
  };
  let leave = async () => {
    await channel.leave();
    await rtmClient.logout();
  };

  window.addEventListener("beforeunload", leave);

  let getParticipants = async () => {
    let participants = await channel.getMembers();
    updateParticipantTotal(participants);
    for (let i = 0; i < participants.length; i++) {
      addParticipantToDom(participants[i]);
    }
  };

  getParticipants();

  let messageForm = document.getElementById("message_form");
  messageForm.addEventListener("submit", sendMessage);
};
initiate();
