require('dotenv/config')
const { Client, IntentsBitField } = require('discord.js')
const axios = require('axios')

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
})

client.on('ready', () => {
  console.log('The bot is online!')
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return
  if (message.channel.id !== process.env.CHANNEL_ID) return
  if (message.content.startsWith('!')) return

  let conversationLog = [
    { role: 'system', content: 'you are a informational chatbot.' },
  ]

  message.channel.sendTyping()

  let prevMessages = await message.channel.messages.fetch({ limit: 3 })
  prevMessages.reverse()

  prevMessages.forEach((msg) => {
    if (message.content.startsWith('!')) return
    if (msg.author.id !== client.user.id && message.author.bot) return
    if (msg.author.id !== message.author.id) return

    conversationLog.push({
      role: 'user',
      content: msg.content,
    })
  })

  try {
    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    message.reply(result.data.choices[0].message)
  } catch (error) {
    console.error('OpenAI API error:', error.response.data)
  }
})

client.login(process.env.TOKEN)
