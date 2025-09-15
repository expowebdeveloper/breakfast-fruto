import Image from "next/image";
// import itmImg from "../../public/images/breakfast-hero-img.png";
import ItemCounter from "./ItemCounter";
import Button from "./Button";

const Summary = () => {
  // const {handleIncrease,handleDecrease,itemCount } = useCount();
  return (
    <div className="common-card">
      <div>
        <Image src={itmImg} alt={"logo"} width={100} height={100} />
        <p>Classic Basket</p>
        <span>$200.00</span>
        {/* <ItemCounter
          count={itemCount}
          handleDecrease={handleDecrease}
          handleIncrease={handleIncrease}
        /> */}
      </div>
      <div>
        <Image src={itmImg} alt={"logo"} width={100} height={100} />
        <p>Papaya</p>
        <span>$40.00</span>
        {/* <ItemCounter
          count={itemCount}
          handleDecrease={handleDecrease}
          handleIncrease={handleIncrease}
        /> */}
      </div>
      <div>
        <input type="checkbox" />
        <span>Gift Wrap</span>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ul className="space-y-4 text-sm mt-2">
            {/* <li>Order Packing Charges</li> */}
            {/* <li>Platform Fee</li> */}
            <li>Discount Apply</li>
            <li>Delivery Fee</li>
            <li>Taxes</li>
          </ul>
          <ul className="space-y-4 text-sm mt-2">
            {/* <li>$10.00</li> */}
            <li>$200.00</li>
            <li>$5.00</li>
            <li>$20.00</li>
            <li>-$10.00</li>
            <li>$6.00</li>
          </ul>
        </div>
        <div className="flex justify-between">
          <h1>Total</h1>
          <span>$204.00</span>
        </div>
        <Button
          btnText="Confirm Order"
          className="common-btn w-1/2 rounded-lg"
        />
      </div>
    </div>
  );
};

export default Summary;
