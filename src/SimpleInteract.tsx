import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";
import { InteractionForm } from "./InteractionForm";
import { Vouchers } from "./Vouchers";
import { VoucherButtons } from "./VoucherButtons";

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
  usersWhoSubmittedRanks: JSX.Element;
  firstRankedResponse: string;
  secondRankedResponse: string;
  actions: JSX.Element | null; // New property for action buttons
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
  const [showFullAddresses, setShowFullAddresses] = useState(false); // State to toggle between full and shortened addresses
  const [hideInstructions, setHideInstructions] = useState(false);

  const reloadVouchers = React.useRef<() => void>(() => {});
  const refreshConversations = async () => {
    reloadVouchers.current();
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


  const submitRanks = async (conversationId: number, ranks: number[]) => {
    if (!connectedWallet || !connectedWallet.accounts.length) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
    await contract.submitRank(conversationId, ranks.map(rank => ethers.BigNumber.from(rank)));
    refreshConversations();
  };

  const generateConversationData = (): IConversationData[] => {
    let data: IConversationData[] = [];
    conversations.forEach((conversation, index) => {
      // Ensure we include users even if they haven't submitted any ranks
      const usersWithOrWithoutRanks = conversation.usersWhoSubmittedRanks.length > 0 ? conversation.usersRanks : [{ user: userAddress, ranks: [] }];
      usersWithOrWithoutRanks.forEach((userRank: { user: string; ranks: number[] }) => {
        // Handle cases where no ranks are submitted by a user
        const firstRankIndex = userRank.ranks.length > 0 ? userRank.ranks[0] : undefined;
        const secondRankIndex = userRank.ranks.length > 1 ? userRank.ranks[1] : undefined;
        // Format the user address based on showFullAddresses state and whether ranks have been submitted
        const formattedUser = userRank.ranks.length === 0
          ? (<b>${showFullAddresses ? userRank.user : `${userRank.user.slice(0, 5)}..${userRank.user.slice(-3)}`}</b>)
          : (<>${showFullAddresses ? userRank.user : `${userRank.user.slice(0, 5)}..${userRank.user.slice(-3)}`}</>)
        const hasAllResponses = conversation.responses.length === 2; //TODO this number should come from the contract
        const hasRanks = userRank.ranks.length > 0;
        const actions = hasAllResponses && !hasRanks ? (
          <>
            Preference:
            <button onClick={() => submitRanks(index, [0, 1])}>Confirm</button>
            <button onClick={() => submitRanks(index, [1, 0])}>Switch</button>
          </>
        ) : hasAllResponses ? null : (
          // ) : (
          <>
            Post responses on-chain
            <VoucherButtons dappAddress={dappAddress} conversationId={index} responseId={0} />
            <VoucherButtons dappAddress={dappAddress} conversationId={index} responseId={1} />
          </>
        );
        data.push({
          conversationId: index,
          prompt: conversation.prompt,
          usersWhoSubmittedRanks: formattedUser,
          firstRankedResponse: conversation.responses[0] ? (firstRankIndex !== undefined ? conversation.responses[firstRankIndex] : conversation.responses[0]) : "N/A",
          secondRankedResponse: conversation.responses[1] ? (secondRankIndex !== undefined ? conversation.responses[secondRankIndex] : conversation.responses[1] || "N/A") : "N/A",
          actions,
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
  // console.log(conversations.length, conversations)

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
            <th>ID</th>
            <th>
              Rankers
              <button onClick={() => setShowFullAddresses(!showFullAddresses)}>
                {showFullAddresses ? 'Show Shortened' : 'Show Full'}
              </button>
            </th>
            <th>Prompt</th>
            <th>Prefered</th>
            <th>Runner-up</th>
            <th>Action</th>
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
              <td>{data.actions}</td>
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
