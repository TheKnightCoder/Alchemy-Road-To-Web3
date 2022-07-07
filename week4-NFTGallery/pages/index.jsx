import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react'
import {NFTCard} from './components/nftCard'
const Home = () => {
  const [wallet, setWalletAddress] = useState("");
  const [collection, setCollectionAddress] = useState("");
  const [NFTs, setNFTs] = useState([]);
  const [fetchForCollection, setFetchForCollection] = useState(false);
  const [pageKey, setPageKey] = useState("");

  const fetchNFTs = async (nextPage) => {
    let nfts;
    console.log("fetching nfts");
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_ETH_API_KEY
    const baseURL = `https://eth-mainnet.alchemyapi.io/nft/v2/${apiKey}/getNFTs/`;
    if(!collection.length) {
      console.log("fetching nfts owned by address");

      var requestOptions = {
        method: 'GET',
        redirect: 'follow'
      };
      const fetchURL = `${baseURL}?owner=${wallet}${nextPage ? `&pageKey=${pageKey}` : ""}`;
      nfts = await fetch(fetchURL, requestOptions).then(data => data.json());
    } else {
      console.log("fetching nfts for collection owned by address");
      const fetchURL = `${baseURL}?owner=${wallet}&contractAddresses%5B%5D=${collection}${nextPage ? `&pageKey=${pageKey}` : ""}`;
      nfts = await fetch(fetchURL, requestOptions).then(data => data.json());


    }

    if(nfts) {
      console.log(nfts);
      setNFTs(nfts.ownedNfts);
      nfts.pageKey && setPageKey(nfts.pageKey);
    }
  }

  const fetchNFTsForCollection = async(nextPage) => {
    if(collection.length) {

      var requestOptions = {
        method: 'GET',
        redirect: 'follow'
      };
      const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_ETH_API_KEY
      const baseURL = `https://eth-mainnet.alchemyapi.io/nft/v2/${apiKey}/getNFTsForCollection`;
      const fetchURL = `${baseURL}?contractAddress=${collection}&withMetadata=true${nextPage ? `&startToken=${pageKey}` : ""}`;
      const nfts = await fetch(fetchURL, requestOptions).then(data => data.json());
      if(nfts) {
        console.log("NFTs in collection", nfts);
        setNFTs(nfts.nfts);
        nfts.nextToken && setPageKey(nfts.nextToken);
      }
    }
  }
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-y-3">
      <div className="flex flex-col w-full justify-center items-center gap-y-2">
        <input disabled={fetchForCollection} className="w-2/5 bg-slate-100 py-2 px-2 rounded-lg text-gray-800 focus:outline-blue-300 disabled:bg-slate-50 disabled:text-gray-50" onChange={(e) => setWalletAddress(e.target.value)} value={wallet} type="text" placeholder='Add your wallet address'/>
        <input className="w-2/5 bg-slate-100 py-2 px-2 rounded-lg text-gray-800 focus:outline-blue-300 disabled:bg-slate-50 disabled:text-gray-50" onChange={(e) => setCollectionAddress(e.target.value)} value={collection} type="text" placeholder='Add the collection address'/>
        <label className="text-gray-600"><input className='mr-2' onChange={(e) => setFetchForCollection(e.target.checked)} type="checkbox" />Fetch for collection</label>
        <button className="disabled:bg-slate-500 text-white bg-blue-700 hover:bg-blue-500 px-4 py-2 mt-3 rounded-sm w-1/5" onClick={
          () => {
            fetchForCollection ? fetchNFTsForCollection() : fetchNFTs()
          }
        }>Search</button>
      </div>
      <div className='flex flex-wrap gap-y-12 mt-4 w-5/6 gap-x-2 justify-center'>
        {
          NFTs.length && NFTs.map(nft => {
            return (
              <NFTCard nft={nft}></NFTCard>
            )
          })
        }
      </div>
      <div className="flex flex-col">
      <button className="disabled:bg-slate-500 text-white bg-blue-700 hover:bg-blue-500" onClick={
          () => {
            fetchForCollection ? fetchNFTsForCollection(true) : fetchNFTs(true)
          }
        }>Next Page</button>
      </div>
    </div>
  )
}

export default Home
