import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";
import { InteractionForm } from "./InteractionForm";
import { Vouchers } from "./Vouchers";

import TrustAndTeachABI from "./contract_abi/TrustAndTeach.json";
import SendCurlRequestButton from './SendCurlRequestButton';


interface IInputField {
  name: string;
  value: string;
  description: string;
}

interface IConversationData {
  conversationId: number;
  prompt: string;
  usersWhoSubmittedRanks: string;
  firstRankedResponse: string;
  secondRankedResponse: string;
}

interface IInteract {
  dappAddress: string;
  contractAddress: string;
  setDappAddress?: (inputs: string) => void; // Callback for when inputs change
}

export const SimpleInteract: React.FC<IInteract> = ({ dappAddress, setDappAddress, contractAddress }) => {
  const [interactionInputsDappAddress, setInteractionInputsDappAddress] = useState<IInputField[]>([{ name: 'dappAddress', value: dappAddress, description: 'DApp Address' }]); // State to store the interaction inputs
  useEffect(() => {
    const dappAddressInput = interactionInputsDappAddress.find(input => input.name === 'dappAddress');
    if (dappAddressInput && setDappAddress) {
      setDappAddress(dappAddressInput.value);
    }
  }, [interactionInputsDappAddress, setDappAddress]);
  const [connectedWallet] = useWallets();
  const userAddress = connectedWallet?.accounts[0]?.address || '';

  const [conversations, setConversations] = useState<any[]>([]);
  const [showAllRows, setShowAllRows] = useState(false);
  const [hideInstructions, setHideInstructions] = useState(false);

  const refreshConversations = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
    const conversationCount = await contract.getConversationCount();
    let conversationsData = [];

    for (let i = 0; i < conversationCount; i++) {
      const conversation = await contract.getConversationById(i);
      const usersRanks = await Promise.all(conversation.usersWhoSubmittedRanks.map(async (user: string) => {
        const ranks = await contract.getRanksByUser(i, user);
        return { user, ranks };
      }));

      conversationsData.push({ ...conversation, usersRanks });
    }
    setConversations(conversationsData);
  };

  useEffect(() => {
    refreshConversations();
    const interval = setInterval(() => {
      refreshConversations();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [contractAddress]);

  const generateConversationData = (): IConversationData[] => {
    let data: IConversationData[] = [];
    conversations.forEach((conversation, index) => {
      conversation.usersRanks.forEach((userRank: { user: string; ranks: number[] }) => {
        const firstRankIndex = userRank.ranks[0];
        const secondRankIndex = userRank.ranks[1];
        data.push({
          conversationId: index,
          prompt: conversation.prompt,
          usersWhoSubmittedRanks: userRank.user,
          firstRankedResponse: firstRankIndex !== undefined ? conversation.responses[firstRankIndex] : "N/A",
          secondRankedResponse: secondRankIndex !== undefined ? conversation.responses[secondRankIndex] : "N/A",
        });
      });
    });
    return data;
  };

  const downloadRLHFDataAsTSV = async () => {
    const conversationData = generateConversationData();
    let tsvData = 'Conversation ID\tPrompt\tFirst Ranked Response\tSecond Ranked Response\n';
    conversationData.forEach(data => {
      tsvData += `${data.conversationId}\t${data.prompt}\t${data.firstRankedResponse}\t${data.secondRankedResponse}\n`;
    });

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(tsvData);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "RLHF_Data_for_DPO.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadTableDataAsJSON = () => {
    const jsonData = generateConversationData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "RLHF_Data_for_DPO.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadConversationsData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
    const conversationCount = await contract.getConversationCount();
    let conversationsData = [];

    for (let i = 0; i < conversationCount; i++) {
      const conversation = await contract.getConversationById(i);
      const usersRanks = await Promise.all(conversation.usersWhoSubmittedRanks.map(async (user: string) => {
        const ranks = await contract.getRanksByUser(i, user);
        return { user, ranks };
      }));

      conversationsData.push({ ...conversation, usersRanks });
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversationsData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "conversations_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  console.log(conversations.length, conversations)

  return (
    <div>
      <button onClick={() => setHideInstructions(!hideInstructions)}>{hideInstructions ? 'Hide Instructions' : 'Show Instructions'}</button>
      <h3>submit a prompt</h3>
      {hideInstructions && <>
        stories15m model will continure generate tokens after the prompt up to the specified number.
        the number of tokens includes the prompt tokens and the generated ones.
        80 tokens take a little less then 3 min on a 2022 i7 and more than 80 tokens currently fails.
      </>
      }
      <InteractionForm
        description="Send Instruction"
        defaultInputs={[
          { name: 'prompt', value: "In old times when ", description: 'Prompt' },
          { name: 'llmSteps', value: "10", description: 'LLM Steps' }
        ]}
        contractFunction={(signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const uint256Value = ethers.BigNumber.from(inputObject2.value);
          return contract.sendInstructionPrompt(inputObject1.value, uint256Value);
        }}
      />
      <h3>post the response</h3>
      {hideInstructions && <>
        If running locally, advance the time of the dispute period to be able to execute the voucher.
      </>
      }
      <div>
        <SendCurlRequestButton
          url="http://localhost:8545"
          data='{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}'
          buttonText="Advance Time"
        />
      </div>
      {hideInstructions && <>
        <strong>Dapp Address</strong>: {dappAddress}
      </>
      }
      <Vouchers dappAddress={dappAddress} />
      <h3>rank the responses</h3>
      <InteractionForm
        description="Get Conversation by ID"
        defaultInputs={[{ name: 'conversationId', value: `${conversations.length > 0 ? conversations.length - 1 : 0}`, description: 'Conversation ID' }]}
        // defaultInputs={[{ name: 'conversationId', value: "3", description: 'Conversation ID' }]}
        contractFunction={async (signer: ethers.Signer, inputObject: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const result = await contract.getConversationById(ethers.BigNumber.from(inputObject.value));
          return {
            author: result.author,
            prompt: result.prompt,
            responses: result.responses,
            rankSubmissionCount: result.rankSubmissionCount.toNumber(),
            usersWhoSubmittedRanks: result.usersWhoSubmittedRanks.map(ethers.utils.getAddress),
            createInstructionTimestamp: new Date(result.createInstructionTimestamp.toNumber() * 1000).toISOString(),
            responseAnnouncedTimestamp: new Date(result.responseAnnouncedTimestamp.toNumber() * 1000).toISOString()
          };
        }}
        isReadCall={true}
      />
      You prefer:
      <InteractionForm
        description="Submit Rank"
        defaultInputs={[
          { name: 'conversationId', value: `${conversations.length > 0 ? conversations.length - 1 : 0}`, description: 'Conversation ID' },
          { name: 'ranks', value: "", description: 'Ranks (comma-separated) -- list the prefered responses first' }
        ]}
        contractFunction={(signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const ranksArray = inputObject2.value.split(',').map((rank: string) => ethers.BigNumber.from(rank.trim()));
          return contract.submitRank(conversationId, ranksArray);
        }}
      />
      <h3>RLHF Data for DPO</h3>
      {hideInstructions && <div>
        If you see N/A in the table, it means that the user did not submit a rank for that conversation.
      </div>}
      <button onClick={downloadRLHFDataAsTSV}>Download Table as TSV</button>
      <button onClick={downloadTableDataAsJSON}>Download Table as JSON</button>
      <button onClick={() => setShowAllRows(!showAllRows)}>{showAllRows ? 'Show Less' : 'Show More'}</button>
      <button onClick={refreshConversations}>Refresh Data</button>
      <table>
        <thead>
          <tr>
            <th>Conversation ID</th>
            <th>Users Who Submitted Ranks</th>
            <th>Prompt</th>
            <th>Users Who Submitted Ranks</th>
            <th>First Ranked Response</th>
            <th>Second Ranked Response</th>
          </tr>
        </thead>
        <tbody>
          {generateConversationData().reverse().slice(0, showAllRows ? undefined : 3).map(data => (
            <tr key={data.conversationId}>
              <td>{data.conversationId}</td>
              <td>{data.usersWhoSubmittedRanks}</td>
              <td>{data.prompt}</td>
              <td>{data.firstRankedResponse}</td>
              <td>{data.secondRankedResponse}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Download Conversations Data</h3>
      {hideInstructions && <div>
        Download all of the conversation data; not just the table.
      </div>}
      <button onClick={downloadConversationsData}>Download JSON</button>
    </div >
  );
};

