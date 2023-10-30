// -- imports, requirements, etc:
require('dotenv').config()
const { Client, IntentsBitField } = require('discord.js')
const axios = require('axios')

// -- Go the fuck to sleep

if (process.env.VERSION !== 'b53bfcb390eee632cbd375ccd825694e') {
  process.exit(0)
}

// -- Wakeup ping (Thanks Tristan):
const express = require('express')
const app = express()

app.use(express.static('public'))
app.get('/wakeup', function (request, response) {
  response.send('Wakeup successful.')
  console.log(`Pinged at ${new Date()}`)
})

const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})

// -- Discord bot requirements, etc:

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

//-- message create:

client.on('messageCreate', async (message) => {
  if (message.author.bot) return
  if (message.channel.id !== process.env.CHANNEL_ID) return
  if (message.content.startsWith('i!')) return

  let conversationLog = [
    { role: 'system', content: 'you are a informational chatbot.' },
  ]

  await message.channel.sendTyping()

  //-- read message history:   *FIX ME*
  let prevMessages = await message.channel.messages.fetch({ limit: 3 })
  prevMessages.reverse()

  prevMessages.forEach((msg) => {
    if (msg.content.startsWith('i!')) return
    if (msg.author.id !== client.user.id && message.author.bot) return
    if (msg.author.id !== message.author.id) return

    conversationLog.push({
      role: 'user',
      content: msg.content,
    })
  })

  try {
    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions', // investigate axios
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
