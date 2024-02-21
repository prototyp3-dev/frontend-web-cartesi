# Trust-and-Teach AI DApp web front-end

## Features

- web3-onboard wallet integration
- simple and advanced interfaces with optional instructions
- sending a prompt to on-chain llm
- securly posting the responses of the llm on-chain
- submitting preferences for respnses on chain to create RLHF dataset
- downloading RLHF dataset as a csv or json table
- the advaned UI has inputs for all contract's functions and setting up the contract's and dApp's addresses
- interact's with cartesi graphql server

## Configurtion

Edit src/config.json to set the testnet parameters and deployment, inspect, graphql, rpc addresses.

## Available Scripts

In the project directory, run:

```shell
yarn
yarn codegen
```

to build the app.

```shell
yarn start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
Click on "Show Instructions" button to see the instructions for the front-end.

## Voucher Notes

To execute Vouchers, the voucher epoch must be finalized so the rollups framework generate the proofs.
As a reminder, you can advance time in hardhat with the command:

```shell
curl --data '{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}' http://localhost:8545
```

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/lynoferraz/frontend-web-cartesi)

