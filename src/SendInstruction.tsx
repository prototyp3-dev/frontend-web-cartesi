import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";
import TrustAndTeachABI from "./contract_abi/TrustAndTeach.json";


interface SendInstructionProps {
  dappAddress: string;
}

export const SendInstruction: React.FC<SendInstructionProps> = ({ dappAddress }) => {
  const [inputString, setInputString] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [connectedWallet] = useWallets();
  const provider = new ethers.providers.Web3Provider(connectedWallet.provider);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (provider) {

        console.log("Contract ABI:", TrustAndTeachABI);
        // console.log("Contract Address:", dappAddress);


        const signer = provider.getSigner();
        // const contract = new ethers.Contract(dappAddress, TrustAndTeachABI, signer); // Use the imported ABI
        const contract = new ethers.Contract('0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1', TrustAndTeachABI, signer); // Use the imported ABI

        const tx = await contract.sendInstructionPrompt(inputString);
        const receipt = await tx.wait();

        setTransactionHash(receipt.transactionHash);
        console.log('Transaction successful with hash:', receipt.transactionHash);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputString}
          onChange={(e) => setInputString(e.target.value)}
          placeholder="Enter your instruction"
        />
        <button type="submit" disabled={!provider}>Send Instruction</button>
      </form>

      {transactionHash && (
        <p>Transaction sent! Hash: {transactionHash}</p>
      )}
    </div>
  );
};

