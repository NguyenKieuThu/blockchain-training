import { ethers } from "ethers"
import React, { useState } from "react"
import { useAccount } from "wagmi"
import { ListedNFT as ListedNFTType, NFT, useListNFT } from "../../hooks/useNFT"
import { BuyNFTModal } from "../ui/BuyNFTModal"
import { NFTCard } from "../ui/NFTCard"
import { Spinner } from "./spinner"
import { CONTRACT_ADDRESSES } from "../../constants/env"
import { MarketPlace__factory } from "../../../../../library/typechain/src/factories/contracts/MarketPlace__factory"

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const ListedNFT = () => {
  const { address } = useAccount()
  const { data, isLoading, isError, fetchNextPage, hasNextPage } = useListNFT()
  const [selectedNFT, setSelectedNFT] = useState<ListedNFTType | null>(null)
  const [listingNFT, setListingNFT] = useState<NFT | null>(null)

  console.log("🚀 ~ ListedNFT ~ data:", data)

  const handleBuyNFT = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner()

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.MARKETPLACE_ADDRESS as `0x${string}`,
        MarketPlace__factory.abi,
        signer
      );

      console.log("Selected NFT:", selectedNFT)
      console.log("Contract address:", contract.address)
      console.log("Signer address:", signer.getAddress())
      console.log("Selected NFT price:", selectedNFT?.price)
      const buyerBalanceBefore = await provider.getBalance(signer.getAddress());
      console.log("Buyer balance before transaction:", ethers.formatEther(buyerBalanceBefore));

      const tx = await contract.buyListing(
        selectedNFT?.contractAddress!,
        selectedNFT?.tokenId!,
        { value: selectedNFT?.price! }
      )
      console.log("Transaction hash buy:", tx.hash)

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        console.error("revert transaction");
      } else {
        console.log("transaction success");
      }

      const buyerBalanceAfter = await provider.getBalance(signer.getAddress());
      console.log("Buyer balance after transaction:", ethers.formatEther(buyerBalanceAfter));

      setListingNFT(selectedNFT)

      setSelectedNFT(null) // to close modal

    } catch (err) {
      console.error(err)
      alert("Error while buying NFT")
    }
  }

  return (
    <>
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available NFTs {isLoading && <Spinner />}</h2>
        <div className="grid grid-cols-4 gap-6">
          {data?.pages.map((group, i) => (
            <React.Fragment key={i}>
              {group.map((item) => (
                <NFTCard
                  key={`${item.id}`}
                  tokenId={item.tokenId}
                  name={item.name}
                  nftAddress={item.contractAddress}
                  seller={item.seller}
                  price={BigInt(item.price)}
                  actionLabel={item.seller === address ? "Cancel" : "Buy"}
                  onAction={() => setSelectedNFT(item)}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>
      {selectedNFT && (
        <BuyNFTModal
          isOpen={!!selectedNFT}
          onClose={() => setSelectedNFT(null)}
          onConfirm={() => handleBuyNFT()}
          tokenId={selectedNFT.tokenId}
          price={BigInt(selectedNFT.price)}
          seller={selectedNFT.seller}
        />
      )}
    </>
  )
}
