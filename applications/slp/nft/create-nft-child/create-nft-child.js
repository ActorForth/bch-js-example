/*
  Create a new NFT Child SLP token. Requires:
  - a wallet created with the create-wallet example.
  - wallet to have a small BCH balance.
  - At least one NFT Group token needs to have been created with the
    create-nft-group example.
*/

// EDIT THESE VALUES FOR YOUR USE.
const TOKENID =
'89aaa0f20050b76f256e06fe7821cd0c31c058fd9b949925e402444ee13c2be6'
  // 'a4919e3b3fc922d0d7a200034fe3d59941a22cac64892d6ee37cd5dc89bbfcb4'
  // '031aaaf07248ff195d40d00bd02a2847843d2afd6d482db3df0501243aacc25e'
// const TO_SLPADDR = '' // The address to send the new tokens.

// uncomment to select network
// const NETWORK = 'mainnet'
// const NETWORK = 'testnet'
const NETWORK = 'regtest'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
// const REGTEST_API_FREE = 'http://128.199.203.157:3000/v3/'
const REGTEST_API_FREE = 'http://localhost:3000/v3/'


const WALLET_NAME = `wallet-info-${NETWORK}-pat-proposal`

// bch-js-examples require code from the main bch-js repo
const BCHJS = require('bch-js-reg')

// Instantiate bch-js based on the network.
let bchjs
let regtest
switch (NETWORK) {
  case 'mainnet':
    bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
    regtest = false
    break
  case 'testnet':
    bchjs = new BCHJS({ restURL: TESTNET_API_FREE })
    regtest = false
    break
  case 'regtest':
    bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
    regtest = true
    break
  default:
    bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
    regtest = true
}

// Open the wallet generated with create-wallet.
let walletInfo
try {
  walletInfo = require(`../../../${WALLET_NAME}.json`)
} catch (err) {
  console.log(
    'Could not open wallet.json. Generate a wallet with create-wallet first.'
  )
  process.exit(0)
}

async function createNFTChild () {
  try {
    const SEND_MNEMONIC = walletInfo.mnemonic
    const change = await changeAddrFromMnemonic(SEND_MNEMONIC)

    // ge-childt the cash address
    const cashAddress = bchjs.HDNode.toCashAddress(change, regtest)
    console.log('CASHADDRESS', cashAddress)
    // const slpAddress = bchjs.SLP.Address.toSLPAddress(cashAddress)

    // Get a UTXO to pay for the transaction.
    const data = await bchjs.Electrumx.utxo(cashAddress)
    const utxos = data.utxos
    console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

    if (utxos.length === 0) {
      throw new Error('No UTXOs to pay for transaction! Exiting.')
    }

    // Identify the SLP token UTXOs.
    let tokenUtxos = await bchjs.SLP.Utils.tokenUtxoDetails(utxos)
    console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

    // Filter out the non-SLP token UTXOs.
    const bchUtxos = utxos.filter((utxo, index) => {
      const tokenUtxo = tokenUtxos[index]
      if (!tokenUtxo.isValid) return true
    })
    // console.log(`bchUTXOs: ${JSON.stringify(bchUtxos, null, 2)}`);

    if (bchUtxos.length === 0) {
      throw new Error('Wallet does not have a BCH UTXO to pay miner fees.')
    }

    // Filter out the token UTXOs that match the user-provided token ID
    // and contain the minting baton.
    tokenUtxos = tokenUtxos.filter((utxo, index) => {
      if (
        utxo && // UTXO is associated with a token.
        utxo.tokenId === TOKENID && // UTXO matches the token ID.
        utxo.utxoType === 'token' // UTXO is not a minting baton.
      ) { return true }
    })
    console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

    if (tokenUtxos.length === 0) {
      throw new Error('No token UTXOs for the specified token could be found.')
    }

    // Get the biggest UTXO to pay for the transaction.
    const utxo = findBiggestUtxo(utxos)
    // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

    // instance of transaction builder
    let transactionBuilder
    if (NETWORK === 'mainnet') {
      transactionBuilder = new bchjs.TransactionBuilder()
    } else transactionBuilder = new bchjs.TransactionBuilder(NETWORK)

    const originalAmount = utxo.value
    const vout = utxo.tx_pos
    const txid = utxo.tx_hash

    // add the NFT Group UTXO as an input. This NFT Group token must be burned
    // to create a Child NFT, as per the spec.
    transactionBuilder.addInput(tokenUtxos[0].tx_hash, tokenUtxos[0].tx_pos)

    // add input with txid and index of vout
    transactionBuilder.addInput(txid, vout)

    // Set the transaction fee. Manually set for ease of example.
    const txFee = 550

    // amount to send back to the sending address.
    // Subtract two dust transactions for minting baton and tokens.
    const remainder = originalAmount - txFee - (546 * 2)

    // Generate SLP config object
    const configObj = {
      name: 'Evt1-nft-child-3',
      ticker: 'Evt1NftChild3',
      documentUrl: 'https://github.com/ActorForth/Auction-Protocol/blob/main/proposal-spec.md',
      documentHash: '98e2177026c972b68d13ed3e53b59d416733014f1d26a1285ab3aeeb0c153cda',
      mintBatonVout: ''
    }

    // Generate the OP_RETURN entry for an SLP GENESIS transaction.
    const script = bchjs.SLP.NFT1.generateNFTChildGenesisOpReturn(configObj)
    // const data = bchjs.Script.encode(script)
    // const data = compile(script)

    // OP_RETURN needs to be the first output in the transaction.
    transactionBuilder.addOutput(script, 0)

    // Send dust transaction representing the tokens.
    transactionBuilder.addOutput(
      bchjs.Address.toLegacyAddress(cashAddress),
      546
    )

    // Send dust transaction representing minting baton.
    // transactionBuilder.addOutput(
    //   bchjs.Address.toLegacyAddress(cashAddress),
    //   546
    // )

    // add output to send BCH remainder of UTXO.
    transactionBuilder.addOutput(cashAddress, remainder)
    console.log('TRANSACTIONBUILDER', transactionBuilder)

    // send back id
    transactionBuilder.addOutput(opreturnOutput('slpreg:qrhv6f635vqp3l605n26q2qleae2ajdfagv662spgm'), 0)


    // Generate a keypair from the change address.
    const keyPair = bchjs.HDNode.toKeyPair(change)

    // Sign the input for the UTXO paying for the TX.
    let redeemScript
    transactionBuilder.sign(
      0,
      keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      546
    )

    // Sign the Token UTXO for the NFT Group token that will be burned in this
    // transaction.
    transactionBuilder.sign(
      1,
      keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      originalAmount
    )

    // build tx
    const tx = transactionBuilder.build()
    // output rawhex
    const hex = tx.toHex()
    console.log(`TX hex: ${hex}`)
    // console.log(` `)

    // Broadcast transation to the network
    const txidStr = await bchjs.RawTransactions.sendRawTransaction([hex])
    console.log('Check the status of your transaction on this block explorer:')
    if (NETWORK === 'testnet') {
      console.log(`https://explorer.bitcoin.com/tbch/tx/${txidStr}`)
    } else console.log(`https://explorer.bitcoin.com/bch/tx/${txidStr}`)
  } catch (err) {
    console.error('Error in createNFTChild: ', err)
  }
}
createNFTChild()

// Returns the utxo with the biggest balance from an array of utxos.
function findBiggestUtxo (utxos) {
  let largestAmount = 0
  let largestIndex = 0

  for (var i = 0; i < utxos.length; i++) {
    const thisUtxo = utxos[i]

    if (thisUtxo.value > largestAmount) {
      largestAmount = thisUtxo.value
      largestIndex = i
    }
  }

  return utxos[largestIndex]
}

function opreturnOutput (message) {
  const script = [
    bchjs.Script.opcodes.OP_RETURN,
    Buffer.from('6d02', 'hex'), // Makes message comply with the memo.cash protocol.
    Buffer.from(`${message}`)
  ]

  // Compile the script array into a bitcoin-compliant hex encoded string.
  const dataOutput = bchjs.Script.encode(script)
  return dataOutput
}

async function changeAddrFromMnemonic (mnemonic) {
  // root seed buffer
  const rootSeed = await bchjs.Mnemonic.toSeed(mnemonic)

  // master HDNode
  let masterHDNode
  if (NETWORK === 'mainnet') masterHDNode = bchjs.HDNode.fromSeed(rootSeed)
  else masterHDNode = bchjs.HDNode.fromSeed(rootSeed, NETWORK)

  // HDNode of BIP44 account
  const account = bchjs.HDNode.derivePath(masterHDNode, "m/44'/145'/0'")

  // derive the first external change address HDNode which is going to spend utxo
  const change = bchjs.HDNode.derivePath(account, '0/0')

  return change
}
