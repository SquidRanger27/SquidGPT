// -- imports, requirements, etc:
require('dotenv').config()
const { Client, IntentsBitField } = require('discord.js')
const axios = require('axios')

// -- Go the fuck to sleep

// console.log(process.env)

if (process.env.VERSION !== '123') {
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
  const settings = {
    headerPrompt:
      'You are a header generator chatbot. You summerise text sent by the user into a concise, simple, and neutral half sentence to be used as a topic header for the message. The header is always less than 35 characters. The header is general, not specific. The header should not be wrapped in any quotations. The header does not try to answer the question or text.',
    assistantPrompt:
      'You are an assistant discord chatbot. You provide clear and concise responses, to the users questions and queries.',
    modelChoicePrompt:
      'You are gpt-4. A highly advanced and intelligent AI GPT. You task is to evaluate how important and specific a question from the user is, and output a single number value between 0 and 1, where 0 is simple and 1 is complex. You should not answer the user.\nFactors that you should take in to account:\n- If the topic is specific, the value to should be closer to 1\n- If the topic is general knowlege related, the answer should be closer to 0\n- If the topic has little information about it on the internet, the value should be closer to 1\n- If the topic is a well known idea, it should be closer to 0\n- If the user explicity asks for gpt4 the value should be 1. \n- If the user explicity asks for gpt3 the value should be 0.',
  }
  if (
    message.content.startsWith('i!') ||
    message.author.bot ||
    message.channel.id !== process.env.CHANNEL_ID
  ) {
    return
  }
  let conversationLog = [
    { role: 'system', content: 'you are a informational chatbot.' },
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
