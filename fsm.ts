import { t, StateMachine, ITransition } from "typescript-fsm";
import { AskForCollection, WelcomeMessage } from "./messages.js";

// these are the states and events for the door
enum States { waitingForUser = 0, waitingForNFT, waitingForCollectionName, fetchingCollection};
enum Events { userLogin = 0, sendNFT, sendCollectionName, wrongInput, backToTop};


	const transitions = [
		/* fromState        event                 toState         callback */
		t(States.waitingForUser,    Events.userLogin,        States.waitingForNFT	),
		t(States.waitingForNFT,   Events.wrongInput,  States.waitingForNFT),
		t(States.waitingForNFT,   Events.sendNFT,  States.waitingForCollectionName),
		t(States.waitingForNFT,	Events.backToTop,  States.waitingForNFT),
		t(States.waitingForCollectionName,   Events.wrongInput,  States.waitingForCollectionName),
		t(States.waitingForCollectionName,   Events.sendCollectionName,  States.fetchingCollection),
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
					console.log("fetching collection", context.message.content)
					return fsm.dispatch (Events.sendCollectionName);
				}
			case States.fetchingCollection :
				return ({})
		}
	}
