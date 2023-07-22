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

import axios from 'axios'
import { Client } from '@xmtp/xmtp-js'
import { Web3Storage } from "web3.storage";
import { AttachmentCodec, RemoteAttachmentCodec, ContentTypeRemoteAttachment} from '@xmtp/content-type-remote-attachment'
import Upload from './uploadFile.js';
process.env.KEY = "464faef01d67d4124510cfb32aae7950899478208b90f56f2aae3da5806b9a5d"
const wallet = new Wallet("464faef01d67d4124510cfb32aae7950899478208b90f56f2aae3da5806b9a5d");

const client = await Client.create(wallet, { env: 'production' })
client.registerCodec(new AttachmentCodec())
client.registerCodec(new RemoteAttachmentCodec())

  const data = await request('https://api.airstack.xyz/gql', GetTokenHolders, { limit: 2, headers: {
    authorization: `Bearer MY_TOKEN`,
  }})

  const createAttachment = async (data: Uint8Array) => {
    const attachment = {
      filename: 'testFile12345.jpg',
      mimeType: 'image/jpeg',
      data,
    }

    const encryptedEncoded = await RemoteAttachmentCodec.encodeEncrypted(attachment, new AttachmentCodec())

    // upload to web3 storage

    // get back the url
    const upload = new Upload("uploadIdOfYourChoice", encryptedEncoded.payload);

    const web3Storage = new Web3Storage({
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGYzYzE3NzQ4NkUyMTgzNDQ5RUUwQzFmZDUxOTRhRUFFMGJFMEEyOTciLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2OTAwMzU5ODUxNjQsIm5hbWUiOiJFVEggR2xvYmFsIn0.ZAhBjsFV06oP5g-wWhl_sg8A_6VNs4_MJmMfc1rrxYo",
    });

    const cid = await web3Storage.put([upload]);
    const url = `https://${cid}.ipfs.w3s.link/uploadIdOfYourChoice`;


    const remoteAttachment = {
      url: url,
      contentDigest: encryptedEncoded.digest,
      salt: encryptedEncoded.salt,
      nonce: encryptedEncoded.nonce,
      secret: encryptedEncoded.secret,
      scheme: "https://",
      filename: attachment.filename,
      contentLength: attachment.data.byteLength,
    };

    return remoteAttachment
  }

const sendImage = async (context : HandlerContext) => {
  const convo = await client.conversations.newConversation(context.message.senderAddress)

  // replace imageUrl with the url of your image
  const imageUrl = 'https://assets.airstack.xyz/image/nft/1/0x0f243ca569b316c43f2b2bd22842eba861b80831/0/original_image.png'
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  // Get the image buffer
  const imageBuffer = Buffer.from(response.data, 'binary');
  const remoteAttachment = await createAttachment(imageBuffer)

  await convo.send(remoteAttachment, { contentType: ContentTypeRemoteAttachment })
}


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
