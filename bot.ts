import run from '@xmtp/bot-starter'
import { Wallet } from 'ethers'

//npm run bot
//@ts-ignore
import qrcode from 'qrcode-terminal'
import { request, gql } from 'graphql-request'
import { GetTokenHolders } from './query';
import { WelcomeMessage } from './messages';

const wallet = new Wallet("464faef01d67d4124510cfb32aae7950899478208b90f56f2aae3da5806b9a5d");
console.log("toto")

qrcode.generate(`https://go.cb-w.com/messaging?address=${wallet?.address}`)

run(async (context) => {
  const data = await request('https://api.airstack.xyz/gql', GetTokenHolders, { limit: 2, headers: {
    authorization: `Bearer MY_TOKEN`,
  }})
  console.dir(data, { depth: null })
  // When someone sends your bot a message, you can get the DecodedMessage
  // from the HandlerContext's `message` field
  await context.reply(WelcomeMessage);

  const messageBody = context.message.content;

  // To reply, just call `reply` on the HandlerContext.
  await context.reply(`ECHO: ${messageBody}`);
  await context.reply(`Is there anything else I can help you with?`);
}).catch((err) => {
  console.error(err);
});
