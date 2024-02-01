import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";

interface IInteractionForm {
  contractAddress: string;
  description: string;
  defaultInput01: string;
  defaultInput02?: string;
  contractFunction: (signer: ethers.Signer, ...args: any[]) => Promise<ethers.providers.TransactionResponse>;
}

export const InteractionForm: React.FC<IInteractionForm> = ({ contractAddress, description, defaultInput01, defaultInput02, contractFunction }) => {
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [connectedWallet] = useWallets();
  const provider = new ethers.providers.Web3Provider(connectedWallet.provider);

  const [inputString, setInputString] = useState<string>(defaultInput01);
  const [inputUint256, setInputUint256] = useState<string>(defaultInput02 || '');
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (provider) {
        const signer = provider.getSigner();
        if (defaultInput02) {
          const tx = await contractFunction(signer, inputString, inputUint256);
          const receipt = await tx.wait();
          setTransactionHash(receipt.transactionHash);
          console.log('Transaction successful with hash:', receipt.transactionHash);
        } else {
          const tx = await contractFunction(signer, inputString);
          const receipt = await tx.wait();
          setTransactionHash(receipt.transactionHash);
          console.log('Transaction successful with hash:', receipt.transactionHash);
        }
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
          placeholder="Enter your input"
        />
        {defaultInput02 && (
          <input
            type="number"
            value={inputUint256}
            onChange={(e) => setInputUint256(e.target.value)}
            placeholder="Enter your uint256 input"
          />
        )}
        <button type="submit" disabled={!provider}>{description}</button>
      </form>
      {transactionHash && (
        <p>Transaction sent! Hash: {transactionHash}</p>
      )}
    </div>
  );
};

