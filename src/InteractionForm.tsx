import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";

interface InputField {
  name: string;
  value: string;
  description: string;
}

interface IInteractionForm {
  contractAddress: string;
  description: string;
  defaultInputs: InputField[];
  contractFunction: (signer: ethers.Signer, ...args: any[]) => Promise<any>;
  isReadCall?: boolean;
  isReadCall?: boolean;
}

export const InteractionForm: React.FC<IInteractionForm> = ({ contractAddress, description, defaultInputs, contractFunction, isReadCall }) => {
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [connectedWallet] = useWallets();
  const provider = new ethers.providers.Web3Provider(connectedWallet.provider);

  const [inputs, setInputs] = useState<InputField[]>(defaultInputs);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (provider) {
        const signer = provider.getSigner();
        if (isReadCall) {
          const result = await contractFunction(signer, ...inputs);
          console.log('Read call result:', result);
        } else {
          const tx = await contractFunction(signer, ...inputs);
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {inputs.map((inputField, index) => (
          <div key={inputField.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label htmlFor={inputField.name}>{inputField.description}</label>
            <input
              id={inputField.name}
              type="text"
              value={inputField.value}
              onChange={(e) => {
                const newInputs = [...inputs];
                newInputs[index] = { ...inputField, value: e.target.value };
                setInputs(newInputs);
              }}
              placeholder={inputField.description}
            />
          </div>
        ))}
        <button type="submit" disabled={!provider} style={{ marginTop: 'auto' }}>{description}</button>
      </form>
      {transactionHash && !isReadCall && (
        <p>Transaction sent! Hash: {transactionHash}</p>
      )}
    </div>
  );
};

