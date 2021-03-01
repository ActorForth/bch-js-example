/*
  Send tokens of type TOKENID to user with SLPADDR address.
*/

// CUSTOMIZE THESE VALUES FOR YOUR USE
const TOKENQTY = 1000
const TOKENID =
'082bc14bfcf8ae4963ade499ab13104cbf5498eca1248eb25f637d72ed9186ed'
  // 'eb3870c5c298a69a089620f107d57f61999e7b3d7e16b7b1314475472eb7c5ef'
  // '1c68c16433340a2d5cf98bc20494b576a6f9b82db1f3e49efac329ff1f077bd1'

// uncomment to select network
// const NETWORK = 'mainnet'
// const NETWORK = 'testnet'
const NETWORK = 'regtest'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
const REGTEST_API_FREE = 'http://128.199.203.157:3000/v3/'
// const REGTEST_API_FREE = 'http://localhost:3000/v3/'

const FUNDING_WALLET = `wallet-info-${NETWORK}-pat-proposal`
const SENDTO_WALLET = `wallet-info-${NETWORK}-bidder1`

// const WALLET_NAME = `wallet-info-${NETWORK}-pat-proposal`
// const WALLET_NAME2 = `wallet-info-${NETWORK}-pat-proposal`

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
let SENDING_WALLET_INFO
try {
  SENDING_WALLET_INFO = require(`../../${SENDTO_WALLET}.json`)
} catch (err) {
  console.log(
    'Could not open wallet.json. Generate a wallet with create-wallet first.'
  )
  process.exit(0)
}
let FUNDING_WALLET_INFO
try {
  FUNDING_WALLET_INFO = require(`../../${FUNDING_WALLET}.json`)
} catch (err) {
  console.log(
    'Could not open wallet.json. Generate a wallet with create-wallet first.'
  )
  process.exit(0)
}
// console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)
// let TO_SLPADDR = walletInfo.slpAddress
let TO_SLPADDR = SENDING_WALLET_INFO.slpAddress
const FUNDING_SLPADDR = FUNDING_WALLET_INFO.slpAddress
const FUNDING_MNEMONIC = FUNDING_WALLET_INFO.mnemonic
const FUNDING_CASHADDRESS = FUNDING_WALLET_INFO.cashAddress

async function sendToken () {
  try {
    const rootSeed = await bchjs.Mnemonic.toSeed(FUNDING_MNEMONIC)
    const masterHDNode = bchjs.HDNode.fromSeed(rootSeed, NETWORK)
    const childNode = masterHDNode.derivePath(`m/44'/145'/0'/0/0`)

    // Generate an EC key pair for signing the transaction.
    const keyPair = bchjs.HDNode.toKeyPair(childNode)

    // Get UTXOs held by this address.
    const data = await bchjs.Electrumx.utxo(FUNDING_CASHADDRESS)
    const utxos = data.utxos
    // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

    if (utxos.length === 0) throw new Error('No UTXOs to spend! Exiting.')

    // Identify the SLP token UTXOs.
    let tokenUtxos = await bchjs.SLP.Utils.tokenUtxoDetails(utxos)

    // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

    // Filter out the non-SLP token UTXOs.
    const bchUtxos = utxos.filter((utxo, index) => {
      const tokenUtxo = tokenUtxos[index]
      if (!tokenUtxo.isValid) return true
    })
    // console.log(`bchUTXOs: ${JSON.stringify(bchUtxos, null, 2)}`)

    if (bchUtxos.length === 0) {
      throw new Error('Wallet does not have a BCH UTXO to pay miner fees.')
    }
    // console.log('TOKENUTXOS', tokenUtxos)
    // Filter out the token UTXOs that match the user-provided token ID.
    tokenUtxos = tokenUtxos.filter((utxo, index) => {
      if (
        utxo && // UTXO is associated with a token.
        utxo.tokenId === TOKENID && // UTXO matches the token ID.
        utxo.utxoType === 'token' // UTXO is not a minting baton.
      ) { return true }
    })
    // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`);

    if (tokenUtxos.length === 0) {
      throw new Error('No token UTXOs for the specified token could be found.')
    }

    // Choose a UTXO to pay for the transaction.
    const bchUtxo = findBiggestUtxo(bchUtxos)
    // console.log(`bchUtxo: ${JSON.stringify(bchUtxo, null, 2)}`);

    console.log('TOKENUTXOS', tokenUtxos)
    // Generate the OP_RETURN code.
    const slpSendObj = bchjs.SLP.TokenType1.generateSendOpReturn(
      tokenUtxos,
      TOKENQTY
    )
    const slpData = slpSendObj.script
    // console.log(`slpOutputs: ${slpSendObj.outputs}`);

    // BEGIN transaction construction.

    // instance of transaction builder
    let transactionBuilder
    if (NETWORK === 'mainnet') {
      transactionBuilder = new bchjs.TransactionBuilder()
    } else transactionBuilder = new bchjs.TransactionBuilder(NETWORK)

    // Add the BCH UTXO as input to pay for the transaction.
    const originalAmount = bchUtxo.value
    transactionBuilder.addInput(bchUtxo.tx_hash, bchUtxo.tx_pos)

    // add each token UTXO as an input.
    for (let i = 0; i < tokenUtxos.length; i++) {
      transactionBuilder.addInput(tokenUtxos[i].tx_hash, tokenUtxos[i].tx_pos)
    }

    // get byte count to calculate fee. paying 1 sat
    // Note: This may not be totally accurate. Just guessing on the byteCount size.
    // const byteCount = this.BITBOX.BitcoinCash.getByteCount(
    //   { P2PKH: 3 },
    //   { P2PKH: 5 }
    // )
    // //console.log(`byteCount: ${byteCount}`)
    // const satoshisPerByte = 1.1
    // const txFee = Math.floor(satoshisPerByte * byteCount)
    // console.log(`txFee: ${txFee} satoshis\n`)

    // 66: rate limited free transaction
    const txFee = 550

    // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
    // const remainder = originalAmount - txFee - dust * numberOfTXout
    const remainder = originalAmount - txFee - 546 * 2
    if (remainder < 1) {
      throw new Error('Selected UTXO does not have enough satoshis')
    }
    // console.log(`remainder: ${remainder}`)

    // Add OP_RETURN as first output.
    transactionBuilder.addOutput(slpData, 0)

    // Send the token back to the same wallet if the user hasn't specified a
    // different address.
    if (TO_SLPADDR === '') TO_SLPADDR = FUNDING_SLPADDR
    // console.log('TO_SLPADDR', TO_SLPADDR)
    // Send dust transaction representing tokens being sent.
    transactionBuilder.addOutput(
      bchjs.SLP.Address.toLegacyAddress(TO_SLPADDR),
      546
    )

    // Return any token change back to the sender.
    if (slpSendObj.outputs > 1) {
      transactionBuilder.addOutput(
        bchjs.SLP.Address.toLegacyAddress(FUNDING_SLPADDR),
        546
      )
    }

    // Last output: send the BCH change back to the wallet.
    transactionBuilder.addOutput(
      bchjs.Address.toLegacyAddress(FUNDING_CASHADDRESS),
      remainder - 546
    )

    // const script = [
    //   Buffer.from('msg', 'hex'),
    //   Buffer.from('0328b6092d0bc8201b232504a67827da3694af42487fba09b2e731d863b732c3b5', 'hex'),
    //   bchjs.Script.opcodes.OP_CHECKDATASIG
    // ]

    // BID1NFT_TXID
    // Compile the script array into a bitcoin-compliant hex encoded string.
    // const dataOutput = opreturnOutput('a4919e3b3fc922d0d7a200034fe3d59941a22cac64892d6ee37cd5dc89bbfcb4')
    // console.log('DATA', dataOutput)
    // // Add the OP_RETURN output.
    // transactionBuilder.addOutput(dataOutput, 0)
    //
    // // Bidder1Address [optional]
    // // Compile the script array into a bitcoin-compliant hex encoded string.
    // const dataOutput2 = opreturnOutput('slpreg:qrwz7r4yndrp957l9mkygl8r95et8yfexusvu8asqx')
    // console.log('DATA', dataOutput2)
    // transactionBuilder.addOutput(dataOutput2, 0)
    //
    // // Bidder1Address_sig base64
    // const dataOutput3 = opreturnOutput('MEUCIQCjRC-q4idR3Pnmx6NtQewY83zTel_xOYDZ56s2YirbEwIgXOTI7habx_M7Ee0sGeDM2zF1crvqeOwirNvLKCcwbqE=')
    // console.log('DATA', dataOutput3)
    // transactionBuilder.addOutput(dataOutput3, 0)

    // // EVT_ID (genesis group nft txid) [optional]
    // const dataOutput4 = opreturnOutput('031aaaf07248ff195d40d00bd02a2847843d2afd6d482db3df0501243aacc25e')
    // console.log('DATA', dataOutput4)
    // transactionBuilder.addOutput(dataOutput4, 0)

    // Sign the transaction with the private key for the BCH UTXO paying the fees.
    let redeemScript
    transactionBuilder.sign(
      0,
      keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      originalAmount
    )

    // Sign each token UTXO being consumed.
    for (let i = 0; i < tokenUtxos.length; i++) {
      const thisUtxo = tokenUtxos[i]

      transactionBuilder.sign(
        1 + i,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        thisUtxo.value
      )
    }

    // build tx
    const tx = transactionBuilder.build()

    // output rawhex
    const hex = tx.toHex()
    console.log('Transaction raw hex: ', hex)

    // END transaction construction.

    // Broadcast transation to the network
    const txidStr = await bchjs.RawTransactions.sendRawTransaction([hex])
    console.log(`Transaction ID: ${txidStr}`)

    console.log('Check the status of your transaction on this block explorer:')
    if (NETWORK === 'testnet') {
      console.log(`https://explorer.bitcoin.com/tbch/tx/${txidStr}`)
    } else console.log(`https://explorer.bitcoin.com/bch/tx/${txidStr}`)
  } catch (err) {
    console.error('Error in sendToken: ', err)
    console.log(`Error message: ${err.message}`)
  }
}
sendToken()

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

// // Generate a change address from a Mnemonic of a private key.
// async function changeAddrFromMnemonic (mnemonic) {
//   // root seed buffer
//   const rootSeed = await bchjs.Mnemonic.toSeed(mnemonic)
//
//   // master HDNode
//   let masterHDNode
//   if (NETWORK === 'mainnet') masterHDNode = bchjs.HDNode.fromSeed(rootSeed)
//   else masterHDNode = bchjs.HDNode.fromSeed(rootSeed, NETWORK)
//
//   // HDNode of BIP44 account
//   const account = bchjs.HDNode.derivePath(masterHDNode, "m/44'/145'/0'")
//
//   // derive the first external change address HDNode which is going to spend utxo
//   const change = bchjs.HDNode.derivePath(account, '0/0')
//
//   return change
// }
