import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";
import { InteractionForm } from "./InteractionForm";
import { Vouchers } from "./Vouchers";
import { NoticeResponse } from './NoticeResponse';
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
  hideInstructions: boolean;
}

export const SimpleInteract: React.FC<IInteract> = ({ dappAddress, setDappAddress, contractAddress, hideInstructions }) => {
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

  const reloadVoucher0 = React.useRef<() => void>(() => { });
  const reloadVoucher1 = React.useRef<() => void>(() => { });
  const reloadNotice0 = React.useRef<() => void>(() => { });
  const reloadNotice1 = React.useRef<() => void>(() => { });
  const refreshConversations = async () => {
    try {
      reloadVoucher0.current();
      reloadVoucher1.current();
      reloadNotice0.current();
      reloadNotice1.current();
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
    } catch (e) {
      console.error(e);
    }
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
          ? (<b>{showFullAddresses ? userRank.user : `${userRank.user.slice(0, 5)}..${userRank.user.slice(-3)}`}</b>)
          : (<>{showFullAddresses ? userRank.user : `${userRank.user.slice(0, 5)}..${userRank.user.slice(-3)}`}</>)
        const hasAllResponses = conversation.responses.length === 2; //TODO this number should come from the contract
        const hasRanks = userRank.ranks.length > 0;
        const actions = hasAllResponses && !hasRanks ? (
          <>
            <div>
              Response Preference Order:
            </div>
            <button onClick={() => submitRanks(index, [1, 0])}>Switch</button>
            <button onClick={() => submitRanks(index, [0, 1])}>Confirm</button>
          </>
        ) : hasAllResponses ? null : (
          // ) : (
          <>
            <div>
              Post responses on-chain
            </div>
            <VoucherButtons dappAddress={dappAddress} conversationId={index} responseId={0} reloadVouchers={reloadVoucher0} />
            <VoucherButtons dappAddress={dappAddress} conversationId={index} responseId={1} reloadVouchers={reloadVoucher1} />
          </>
        );
        data.push({
          conversationId: index,
          prompt: conversation.prompt,
          usersWhoSubmittedRanks: formattedUser,
          firstRankedResponse: conversation.responses[0] ? (firstRankIndex !== undefined ? conversation.responses[firstRankIndex] : conversation.responses[0]) : <NoticeResponse conversationId={index} responseId={0} reloadNotice={reloadNotice0} />,
          secondRankedResponse: conversation.responses[1] ? (secondRankIndex !== undefined ? conversation.responses[secondRankIndex] : conversation.responses[1]) : <NoticeResponse conversationId={index} responseId={1} reloadNotice={reloadNotice1} />,
          actions,
        });
      });
    });
    return data;
  };

  const downloadRLHFDataAsTSV = async () => {
    setShowFullAddresses(true);
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
    setShowFullAddresses(true);
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
    setShowFullAddresses(true);
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

  return (
    <div>
      {hideInstructions && <div style={{ color: 'blue' }} >
        `stories15m` model will generate tokens after the prompt up to the specified number.
        the number of tokens includes the prompt tokens and the generated ones.
        80 tokens take a little less then 3 min on a 2022 i7 and more than 80 tokens currently fails.
        <br />
        To see if the LLM finished generating the sequence, you can click ↻. The table will show notices. When the proofs are ready, the table will offer to post the generated sequences on chain.
        <br />
        If you just deployed this contract, you need to post the cartesi dapp address on-chain, you can do that in the Advance Interaction {'>'} Setup section.
        You also need to set the TrustAndTeach contract's address in the Advance Interaction {'>'} Setup section.
      </div>
      }
      <InteractionForm
        description="Generate"
        defaultInputs={[
          { name: 'prompt', value: "In old times when ", description: 'Prompt' },
          { name: 'llmSteps', value: "10", description: 'Total tokens' }
        ]}
        contractFunction={(signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const uint256Value = ethers.BigNumber.from(inputObject2.value);
          return contract.sendInstructionPrompt(inputObject1.value, uint256Value);
        }}
      />
      <br />
      {hideInstructions && <div style={{ color: 'blue' }}>
        If running locally, click{' '}
        <SendCurlRequestButton
          url="http://localhost:8545"
          data='{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}'
          buttonText="Advance Time"
        />{' '}
        to advance the time of the dispute period to be able to execute the voucher.
      </div>}
      {hideInstructions && <div style={{ color: 'blue' }}>
        The LLM generates 2 responses. The functionality of RLHF is to indicate which of these responses is preferred so that the LLM can be fine-tuned on these preferences.
        This table will show the generated responses as off-chain notice. To post the generated responses on-chain, we need to wait for cartesi to create vouchers.
        <br />
        After you post the vouchers, the responses are on chain. The next step is to rank the responses. If you like the preference of the responses, you can click "Confirm". If you would like to change the order, you can click "switch". "switch" will switch the order of the responses and post these ranks on-chain.
        <br />
        Multiple accounts can rank the responses.
        <br />
        The table will show the responses in the order of the ranks. If no ranks are submitted, the table will show the responses in the order they were generated. If the responses are not generated, the table will show a notice.
        Users can download this table as a CSV or JSON file and use it for DPO RLHF fine-tuning of an LLM.
      </div>}
      <button onClick={downloadRLHFDataAsTSV}>⇩ TSV</button>
      <button onClick={downloadTableDataAsJSON}>⇩ JSON</button>
      <button onClick={() => setShowAllRows(!showAllRows)}>{showAllRows ? 'Shrink Table' : 'Expand Table'}</button>
      <button onClick={refreshConversations}>↻</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>
              Rankers{' '}
              <button onClick={() => setShowFullAddresses(!showFullAddresses)}>
                {showFullAddresses ? 'Shorten' : '..'}
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
      {hideInstructions && <div style={{ color: 'blue' }}>
        Download all of the conversation data as a JSON file.
      </div>}
      <button onClick={downloadConversationsData}>⇩ conversations</button>
    </div >
  );
};
