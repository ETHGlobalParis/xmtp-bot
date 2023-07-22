import { t, StateMachine, ITransition } from "typescript-fsm";
import { AskForCollection, WelcomeMessage } from "./messages.js";
import { GetTokenHoldersByTokenAddress, checkCollectionExists } from "./query.js";

// these are the states and events for the door
enum States { waitingForUser = 0, waitingForNFT, waitingForCollectionName, fetchingCollection};
enum Events { userLogin = 0, sendNFT, sendCollectionName, wrongInput, backToTop, retry};


	const transitions = [
		/* fromState        event                 toState         callback */
		t(States.waitingForUser,    Events.userLogin,        States.waitingForNFT	),
		t(States.waitingForNFT,   Events.wrongInput,  States.waitingForNFT),
		t(States.waitingForNFT,   Events.sendNFT,  States.waitingForCollectionName),
		t(States.waitingForNFT,	Events.backToTop,  States.waitingForNFT),
		t(States.waitingForCollectionName,   Events.retry,  States.waitingForCollectionName),
		t(States.waitingForCollectionName,   Events.sendCollectionName,  States.fetchingCollection),
		t(States.waitingForCollectionName,	Events.backToTop,  States.waitingForUser),
	];

	const fsm = new StateMachine<States, Events>(
   States.waitingForUser,   // initial state
   transitions ,     // array of transitions
	);



	const onWrongCollectionNameInput = (context : any) => async () => {
		await context.reply(`Sorry, I didn't understand that. Please type the name of the collection you are looking for`);
		const messageBody = context.message.content;
		if (messageBody == "") {
			return fsm.dispatch (Events.backToTop);
		}
		else {
			return fsm.dispatch(Events.sendCollectionName);
		}
	}

	const onCollectionNameInput =  async (context : any) => {
	}


	export const dispatch =  async (context : any) => {
		const messageBody = context.message.content;
		const state = fsm.getState();
		console.log("state", state)
		switch(state) {
			case States.waitingForUser:
				console.log("waitingForUser")
				await context.reply(WelcomeMessage);
				return fsm.dispatch(Events.userLogin);
			case States.waitingForNFT:
				if (messageBody == "NFT") {
					await context.reply(AskForCollection)
					return fsm.dispatch(Events.sendNFT);
					}
					await context.reply(`Sorry, I didn't understand that. Please type NFT`);
					return fsm.dispatch(Events.wrongInput);
			case States.waitingForCollectionName :
				if (messageBody == "") {
					return fsm.dispatch(Events.backToTop);
				}
				else {
					const [ matched, indications, error] = await checkCollectionExists(messageBody);
					if (matched) {
						await context.reply(`Fetching tokens for ${indications}`);
						const data = await GetTokenHoldersByTokenAddress(error);
						console.log("data", data)
						await sendTokenInfo(context, data);
						await context.reply(`Going to sleep now. Send me a message to wake me up!`);
						fsm.dispatch (Events.backToTop);
					} else {
						if (error) {
							await context.reply(`Sorry, something went wrong. Please try again`);
							return fsm.dispatch (Events.backToTop);
						}
						if (indications) {
							await context.reply(`Sorry, I couldn't find any collection similar to ${messageBody}. Did you mean any of ${indications}? Please try again`);
							return fsm.dispatch (Events.retry);
						}
						else {
							await context.reply(`Sorry, I couldn't find any collection similar to ${messageBody}. Please try again`);
							return fsm.dispatch (Events.retry);
						}
					}

					console.log("fetching collection", context.message.content)
					return fsm.dispatch (Events.sendCollectionName);
				}
			case States.fetchingCollection :
				return ({})
		}
	}

import { Client } from '@xmtp/xmtp-js'
import { Web3Storage } from "web3.storage";
import { AttachmentCodec, RemoteAttachmentCodec, ContentTypeRemoteAttachment} from '@xmtp/content-type-remote-attachment'
import { Wallet } from 'ethers'
import Upload from './uploadFile.js';
import axios from 'axios'
import HandlerContext from "@xmtp/bot-starter/dist/HandlerContext.js";

const wallet = new Wallet("464faef01d67d4124510cfb32aae7950899478208b90f56f2aae3da5806b9a5d");

const client = await Client.create(wallet, { env: 'production' })
client.registerCodec(new AttachmentCodec())
client.registerCodec(new RemoteAttachmentCodec())

const sendTokenInfo = async (context: any, data: any) => {
	const sendImage = async (context : HandlerContext, imageUrl : any, imageName : string) => {
		try {
		const convo = await client.conversations.newConversation(context.message.senderAddress)

		// replace imageUrl with the url of your image
		const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
		console.log('response', response)

		// Get the image buffer
		const imageBuffer = Buffer.from(response.data, 'binary');
		const imageExt = imageName.split('.').pop() || "*/*";
    const attachment = {
      filename: imageName,
      mimeType: imageExt,
      data : imageBuffer,
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

		await convo.send(remoteAttachment, { contentType: ContentTypeRemoteAttachment })
		} catch (e) { console.error (e)}
	}
	const ethToken = data.ethereum.TokenBalance;
	const polToken = data.polygon.TokenBalance;
	if (ethToken) {
		await context.reply(`Here are the top token found on Ethereum:`);
		for (const id in ethToken) {
			const token = ethToken[id]
			let image = token.tokenNfts.contentValue.image.original;
			const imageName = image.split("/").pop()
			console.log("image", image)
			let owner = token.owner;
			console.log("owner", owner)
			await sendImage(context,image,imageName);
			await context.reply(`Owned by address: ${owner.identity}, hasXMTP: ${owner.xmtp ? "true" : "false"}`);
		}
	}
	if (polToken) {
		await context.reply(`Here are the top token found on Polygon:`);
		console.log("token on polygons")
		console.dir(polToken)
		for (const id in polToken) {
			const token = polToken[id]
			let image: string = token.tokenNfts.contentValue.image.original;
			const imageName = image.split("/").pop() || ""
			console.log("image", image)
			let owner = token.owner;
			console.log("owner", owner)
			await sendImage(context,image,imageName);
			await context.reply(`Owned by address: ${owner.identity}, hasXMTP: ${owner.xmtp ? "true" : "false"}`);
		}
	}

}

