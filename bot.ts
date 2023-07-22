import run from '@xmtp/bot-starter'
import { Wallet } from 'ethers'

//npm run bot
//@ts-ignore
import qrcode from 'qrcode-terminal'
import { request} from 'graphql-request'
import { WelcomeMessage } from './messages.js';
import { GetTokenHolders } from './query.js';
import { dispatch } from './fsm.js';
import HandlerContext from '@xmtp/bot-starter/dist/HandlerContext.js';

const wallet = new Wallet("464faef01d67d4124510cfb32aae7950899478208b90f56f2aae3da5806b9a5d");
console.log("toto")

qrcode.generate(`https://go.cb-w.com/messaging?address=${wallet?.address}`)

run(async (context : HandlerContext) => {
  // When someone sends your bot a message, you can get the DecodedMessage
  // from the HandlerContext's `message` field
  console.log("dispatching...")
  await dispatch (context);
  console.log("dispatched")




  // To reply, just call `reply` on the HandlerContext.
}).catch((err) => {
  console.error(err);
});
