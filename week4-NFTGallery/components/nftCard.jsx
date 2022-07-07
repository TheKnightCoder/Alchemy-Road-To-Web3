import { CopyClipboard } from "./copyClipboard";

export const NFTCard = ({ nft }) => {
  const contradAddess = nft.contract.address;
  return (
    <div className="w-1/4 flex flex-col">
      <div className="rounded-md">
        <img className="object-cover h-128 w-full rounded-t-md" src={nft.media[0].gateway}/>
      </div>
      <div className="flex flex-col y-gap-2 px-2 py-3 bg-slate-100 rounded-b-md h-110">
        <div>
          <h2 className="text-xl text-gray-800">{nft.title}</h2>
          <p className="text-gray-600">{parseInt(nft.id.tokenId, 16)}</p>
          <div className="flex">
            <p className="text-gray-600">{`${contradAddess.substr(0,5)}...${contradAddess.substr(contradAddess.length - 4)}`}</p>
            <CopyClipboard content={contradAddess} />
          </div>
        </div>
        <div className="flex-grow mt-2">
          <p className="text-gray-600">{nft.description?.substr(0, 150)}</p>
        </div>
        <div className="flex justify-center mb-1">
             <button 
              className="py-2 px-4 bg-blue-500 w-1/2 text-center rounded-m text-white cursor-pointer"
              target="_blank" href={`https://etherscan.io/token/${nft.contract.address}`}>
                View on etherscan
            </button>
        </div>
      </div>
    </div>
  )
}