# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

With this project you can test some interactions with the Cartesi Rollups project:

1. Metamask integration
2. Send Inspect state Requests and Listing Reports response
3. Sending inputs
4. Listing Notices
5. Listing Reports
6. Depositing Ether
7. Depositing ERC20
8. Listing Vouchers
9. Executing Vouchers

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

## Configurtion

Edit useRollups.tsx to set you deployments address in testnets (rollupsAddress variable) or set up the environment to connect to hardhat (uncomment)

## Voucher Notes

To execute Vouchers, the voucher epoch must be finalized so the rollups framework generate the proofs.
As a reminder, you can advance time in hardhat with the command:

```shell
curl --data '{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}' http://localhost:8545
```
