// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20 <0.9.0;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CommissionMarket is ReentrancyGuard {
    enum Status {
        Open,
        Assigned,
        Delivered,
        Paid,
        Cancelled
    }

    struct Commission {
        address consumer;
        address creator;
        uint256 maxBudget;
        uint256 acceptedAmount;
        uint256 bidDeadline;
        uint256 reviewDeadline;
        Status status;
        string promptURI;
        string resultURI;
    }

    struct Bid {
        address creator;
        uint256 amount;
        string endpointURI;
        bool active;
    }

    uint256 public constant MIN_BID_WINDOW = 5 seconds;
    uint256 public constant DEFAULT_REVIEW_WINDOW = 1 days;

    uint256 public nextCommissionId;

    mapping(uint256 commissionId => Commission) private commissions;
    mapping(uint256 commissionId => Bid[]) private commissionBids;

    event CommissionCreated(
        uint256 indexed commissionId,
        address indexed consumer,
        uint256 maxBudget,
        uint256 bidDeadline,
        string promptURI
    );
    event BidPlaced(
        uint256 indexed commissionId,
        uint256 indexed bidId,
        address indexed creator,
        uint256 amount,
        string endpointURI
    );
    event BidAccepted(uint256 indexed commissionId, uint256 indexed bidId, address indexed creator, uint256 amount);
    event DeliverySubmitted(
        uint256 indexed commissionId,
        address indexed creator,
        string resultURI,
        uint256 reviewDeadline
    );
    event CommissionPaid(uint256 indexed commissionId, address indexed creator, uint256 amount, uint256 refund);
    event CommissionCancelled(uint256 indexed commissionId, uint256 refund);

    error EmptyPrompt();
    error EmptyEndpoint();
    error EmptyResult();
    error InvalidBidWindow();
    error NoEscrow();
    error NotConsumer();
    error NotCreator();
    error NotOpen();
    error NotAssigned();
    error NotDelivered();
    error BidClosed();
    error InvalidBid();
    error BidTooHigh();
    error NoBids();
    error ReviewStillOpen();
    error TransferFailed();

    function createCommission(
        string calldata promptURI,
        uint256 bidWindow
    ) external payable returns (uint256 commissionId) {
        if (bytes(promptURI).length == 0) revert EmptyPrompt();
        if (bidWindow < MIN_BID_WINDOW) revert InvalidBidWindow();
        if (msg.value == 0) revert NoEscrow();

        commissionId = nextCommissionId++;
        uint256 bidDeadline = block.timestamp + bidWindow;

        commissions[commissionId] = Commission({
            consumer: msg.sender,
            creator: address(0),
            maxBudget: msg.value,
            acceptedAmount: 0,
            bidDeadline: bidDeadline,
            reviewDeadline: 0,
            status: Status.Open,
            promptURI: promptURI,
            resultURI: ""
        });

        emit CommissionCreated(commissionId, msg.sender, msg.value, bidDeadline, promptURI);
    }

    function placeBid(
        uint256 commissionId,
        uint256 amount,
        string calldata endpointURI
    ) external returns (uint256 bidId) {
        Commission storage commission = commissions[commissionId];
        if (commission.status != Status.Open) revert NotOpen();
        if (block.timestamp > commission.bidDeadline) revert BidClosed();
        if (amount == 0 || amount > commission.maxBudget) revert BidTooHigh();
        if (bytes(endpointURI).length == 0) revert EmptyEndpoint();

        bidId = commissionBids[commissionId].length;
        commissionBids[commissionId].push(
            Bid({ creator: msg.sender, amount: amount, endpointURI: endpointURI, active: true })
        );

        emit BidPlaced(commissionId, bidId, msg.sender, amount, endpointURI);
    }

    function acceptBid(uint256 commissionId, uint256 bidId) external {
        Commission storage commission = commissions[commissionId];
        if (msg.sender != commission.consumer) revert NotConsumer();
        if (commission.status != Status.Open) revert NotOpen();
        if (block.timestamp <= commission.bidDeadline) revert BidClosed();
        if (bidId >= commissionBids[commissionId].length) revert InvalidBid();

        Bid storage bid = commissionBids[commissionId][bidId];
        if (!bid.active) revert InvalidBid();

        commission.creator = bid.creator;
        commission.acceptedAmount = bid.amount;
        commission.status = Status.Assigned;

        emit BidAccepted(commissionId, bidId, bid.creator, bid.amount);
    }

    function finalizeLowestBid(uint256 commissionId) external {
        Commission storage commission = commissions[commissionId];
        if (commission.status != Status.Open) revert NotOpen();
        if (block.timestamp <= commission.bidDeadline) revert BidClosed();

        Bid[] storage bids = commissionBids[commissionId];
        if (bids.length == 0) revert NoBids();

        _acceptLowestBid(commissionId, commission, bids);
    }

    function settleExpiredCommission(uint256 commissionId) external nonReentrant {
        Commission storage commission = commissions[commissionId];
        if (commission.status != Status.Open) revert NotOpen();
        if (block.timestamp <= commission.bidDeadline) revert BidClosed();

        Bid[] storage bids = commissionBids[commissionId];
        if (bids.length == 0) {
            _cancelCommission(commissionId, commission);
            return;
        }

        _acceptLowestBid(commissionId, commission, bids);
    }

    function submitDelivery(uint256 commissionId, string calldata resultURI) external nonReentrant {
        Commission storage commission = commissions[commissionId];
        if (commission.status != Status.Assigned) revert NotAssigned();
        if (msg.sender != commission.creator) revert NotCreator();
        if (bytes(resultURI).length == 0) revert EmptyResult();

        commission.resultURI = resultURI;
        commission.reviewDeadline = block.timestamp + DEFAULT_REVIEW_WINDOW;
        commission.status = Status.Delivered;

        emit DeliverySubmitted(commissionId, msg.sender, resultURI, commission.reviewDeadline);

        _payCommission(commissionId, commission);
    }

    function approveDelivery(uint256 commissionId) external nonReentrant {
        Commission storage commission = commissions[commissionId];
        if (msg.sender != commission.consumer) revert NotConsumer();
        if (commission.status != Status.Delivered) revert NotDelivered();

        _payCommission(commissionId, commission);
    }

    function claimAfterReview(uint256 commissionId) external nonReentrant {
        Commission storage commission = commissions[commissionId];
        if (msg.sender != commission.creator) revert NotCreator();
        if (commission.status != Status.Delivered) revert NotDelivered();
        if (block.timestamp <= commission.reviewDeadline) revert ReviewStillOpen();

        _payCommission(commissionId, commission);
    }

    function cancelOpenCommission(uint256 commissionId) external nonReentrant {
        Commission storage commission = commissions[commissionId];
        if (msg.sender != commission.consumer) revert NotConsumer();
        if (commission.status != Status.Open) revert NotOpen();
        if (block.timestamp <= commission.bidDeadline) revert BidClosed();

        _cancelCommission(commissionId, commission);
    }

    function getCommission(uint256 commissionId) external view returns (Commission memory) {
        return commissions[commissionId];
    }

    function getBid(uint256 commissionId, uint256 bidId) external view returns (Bid memory) {
        return commissionBids[commissionId][bidId];
    }

    function getBidCount(uint256 commissionId) external view returns (uint256) {
        return commissionBids[commissionId].length;
    }

    function getCommissionBids(uint256 commissionId) external view returns (Bid[] memory) {
        return commissionBids[commissionId];
    }

    function getCommissions(uint256 startId, uint256 limit) external view returns (Commission[] memory items) {
        uint256 total = nextCommissionId;
        if (startId >= total || limit == 0) {
            return new Commission[](0);
        }

        uint256 endId = startId + limit;
        if (endId > total) {
            endId = total;
        }

        items = new Commission[](endId - startId);
        for (uint256 id = startId; id < endId; id++) {
            items[id - startId] = commissions[id];
        }
    }

    function _acceptLowestBid(uint256 commissionId, Commission storage commission, Bid[] storage bids) private {
        uint256 winningBidId = 0;
        uint256 winningAmount = type(uint256).max;
        for (uint256 bidId = 0; bidId < bids.length; bidId++) {
            if (bids[bidId].active && bids[bidId].amount < winningAmount) {
                winningBidId = bidId;
                winningAmount = bids[bidId].amount;
            }
        }

        if (winningAmount == type(uint256).max) revert NoBids();

        Bid storage bid = bids[winningBidId];
        commission.creator = bid.creator;
        commission.acceptedAmount = bid.amount;
        commission.status = Status.Assigned;

        emit BidAccepted(commissionId, winningBidId, bid.creator, bid.amount);
    }

    function _cancelCommission(uint256 commissionId, Commission storage commission) private {
        uint256 refund = commission.maxBudget;
        commission.status = Status.Cancelled;

        _sendValue(commission.consumer, refund);
        emit CommissionCancelled(commissionId, refund);
    }

    function _payCommission(uint256 commissionId, Commission storage commission) private {
        uint256 payment = commission.acceptedAmount;
        uint256 refund = commission.maxBudget - payment;
        address creator = commission.creator;
        address consumer = commission.consumer;

        commission.status = Status.Paid;

        _sendValue(creator, payment);
        if (refund > 0) {
            _sendValue(consumer, refund);
        }

        emit CommissionPaid(commissionId, creator, payment, refund);
    }

    function _sendValue(address recipient, uint256 amount) private {
        (bool success, ) = recipient.call{ value: amount }("");
        if (!success) revert TransferFailed();
    }
}
