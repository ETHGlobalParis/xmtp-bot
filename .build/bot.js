import run from '@xmtp/bot-starter';
import { Wallet } from 'ethers';
//npm run bot
//@ts-ignore
import qrcode from 'qrcode-terminal';
import { request, gql } from 'graphql-request';
const wallet = new Wallet("464faef01d67d4124510cfb32aae7950899478208b90f56f2aae3da5806b9a5d");
qrcode.generate(`https://go.cb-w.com/messaging?address=${wallet?.address}`);
const document = gql `
query GetTokenHolders($limit: Int) {
  ethereum: TokenBalances(
    input: {filter: {tokenAddress: {_eq: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"}}, blockchain: ethereum, limit: $limit}
  ) {
    TokenBalance {
      tokenAddress
      tokenId
      blockchain
      tokenType
      token {
        name
        symbol
        logo {
          medium
          small
        }
        projectDetails {
          imageUrl
        }
      }
      tokenNfts {
        contentValue {
          video
          image {
            small
            original
            medium
            large
            extraSmall
          }
        }
      }
      owner {
        identity
        addresses
        socials {
          blockchain
          dappSlug
          profileName
        }
        primaryDomain {
          name
        }
        domains {
          chainId
          dappName
          name
        }
        xmtp {
          isXMTPEnabled
        }
      }
    }
    pageInfo {
      nextCursor
      prevCursor
    }
  }
  polygon: TokenBalances(
    input: {filter: {tokenAddress: {_eq: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"}}, blockchain: polygon, limit: $limit}
  ) {
    TokenBalance {
      tokenAddress
      tokenId
      blockchain
      tokenType
      token {
        name
        symbol
        logo {
          medium
          small
        }
        projectDetails {
          imageUrl
        }
      }
      tokenNfts {
        contentValue {
          video
          image {
            small
            original
            medium
            large
            extraSmall
          }
        }
      }
      owner {
        identity
        addresses
        socials {
          blockchain
          dappSlug
          profileName
        }
        primaryDomain {
          name
        }
        domains {
          chainId
          dappName
          name
        }
        xmtp {
          isXMTPEnabled
        }
      }
    }
    pageInfo {
      nextCursor
      prevCursor
    }
  }
}
`;
run(async (context) => {
    const data = await request('https://api.airstack.xyz/gql', document, { limit: 1, headers: {
            authorization: `Bearer MY_TOKEN`,
        } });
    console.dir(data, { depth: null });
    // When someone sends your bot a message, you can get the DecodedMessage
    // from the HandlerContext's `message` field
    await context.reply(`Howdy partner! How can I help you today?`);
    const messageBody = context.message.content;
    // To reply, just call `reply` on the HandlerContext.
    await context.reply(`ECHO: ${messageBody}`);
    await context.reply(`Is there anything else I can help you with?`);
}).catch((err) => {
    console.error(err);
});
