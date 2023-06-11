const { ActivityType } = require("discord.js");
module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    const activities = [`Developed by Wyntine#4811`, `${client.user.username}`];
    let i = 0;

    function setActivity() {
      client.user.setActivity({
        name: `${activities[i++ % activities.length]}`,
        type: ActivityType.Listening,
      });
    }

    setActivity();
    setInterval(() => setActivity(), 22000);
  },
};
