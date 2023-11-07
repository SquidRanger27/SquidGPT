// -- imports, requirements, etc:
import { config } from 'dotenv'
import { Client, IntentsBitField } from 'discord.js'
import * as axios from 'axios'
import express from 'express'

// -- Go the fuck to sleep

// console.log(process.env)

// if (process.env.VERSION !== '123') {
//   process.exit(0)
// }

// -- Wakeup ping (Thanks Tristan):
config()

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
  if (
    message.content.startsWith('i!') ||
    message.author.bot ||
    message.channel.id !== process.env.CHANNEL_ID
  ) {
    return
  }
  let conversationLog = [
    {
      role: 'system',
      content:
        'You are a header generator chatbot. You summerise text sent by the user into a concise, simple, and neutral half sentence to be used as a topic header for the message. The header is always less than 35 characters. The header is general, not specific. The header should not be wrapped in any quotations. The header does not try to answer the question or text.',
    },
  ]
  await message.channel.sendTyping()

  //-- read message history:   *FIX ME*
  let prevMessages = await message.channel.messages.fetch({ limit: 4 })
  prevMessages.reverse()

  prevMessages.forEach((msg) => {
    if (
      msg.content.startsWith('i!') ||
      (msg.author.id !== client.user.id && message.author.bot) ||
      msg.author.id !== message.author.id
    )
      return

    conversationLog.push({
      role: 'user',
      content: msg.content,
    })
  })

  try {
    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions', // investigate axios
      {
        model: 'gpt-4-1106-preview',
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
