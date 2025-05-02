import { ethers } from "ethers"
import React, { useState } from "react"
import { useAccount } from "wagmi"
import { ListedNFT as ListedNFTType, NFT, useListNFT } from "../../hooks/useNFT"
import { BuyNFTModal } from "../ui/BuyNFTModal"
import { NFTCard } from "../ui/NFTCard"
import { Spinner } from "./spinner"
import { CONTRACT_ADDRESSES } from "../../constants/env"
import { MarketPlace__factory } from "../../../../../library/typechain/src/factories/contracts/MarketPlace__factory"
import { MyToken__factory } from "../../../../../library/typechain/src/factories/contracts/Erc20.sol"

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

      let tx;

      if (selectedNFT?.paymentToken === ethers.ZeroAddress) {
        tx = await contract.buyListing(
          selectedNFT.contractAddress,
          selectedNFT.tokenId,
          { value: selectedNFT.price }
        );
      } else if (selectedNFT?.paymentToken === CONTRACT_ADDRESSES.MY_TOKEN_ADDRESS) {
        // approve the marketplace can spend the buyer's token
        const contractToken = new ethers.Contract(
          CONTRACT_ADDRESSES.MY_TOKEN_ADDRESS as `0x${string}`,
          MyToken__factory.abi,
          signer
        );
        const approveTx = await contractToken.approve(
          CONTRACT_ADDRESSES.MARKETPLACE_ADDRESS,
          selectedNFT.price
        );
        await approveTx.wait();

        tx = await contract.buyListingWithERC20(
          selectedNFT.contractAddress,
          selectedNFT.tokenId
        );
      }
      else {
        console.error("Unknown payment token:", selectedNFT?.paymentToken);
        return;
      }

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        console.error("revert transaction");
      } else {
        console.log("transaction success");
      }

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
                  displayCurrency={item.displayCurrency}
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
          displayCurrency={selectedNFT.displayCurrency}
          seller={selectedNFT.seller}
        />
      )}
    </>
  )
}
