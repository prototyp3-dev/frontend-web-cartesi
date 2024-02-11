// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@cartesi/rollups/contracts/inputs/IInputBox.sol";

contract TrustAndTeach {
    address deployer;
    address public L2_DAPP;
    string public license = "MIT";
    string public llm = "stories15m";
    uint256 public num_responses = 2;
    IInputBox inputBox = IInputBox(0x59b22D57D4f067708AB0c00552767405926dc768);

    struct RankSubmission {
        address user;
        uint256[] ranks;
        uint256 rankingTimestamp; // Added rankingTimestamp to RankSubmission
    }

    struct Conversation {
        address author;
        string prompt;
        uint256 llmSteps;
        string[][] responses;
        uint256 rankSubmissionCount;
        mapping(address => RankSubmission) rankSubmissions;
        address[] usersWhoSubmittedRanks; // Array to keep track of users who submitted ranks
        uint256 createInstructionTimestamp;
        uint256 responseAnnouncedTimestamp;
    }

    uint256 public current_conversation_id = 0; // initial value is 0
    mapping(uint256 => Conversation) conversations;

    constructor() {
        deployer = msg.sender;
    }

    function set_dapp_address(address l2_dapp) public {
        require(msg.sender == deployer);
        L2_DAPP = l2_dapp;
    }

    function sendInstructionPrompt(string memory prompt, uint256 llmSteps)
        public
    {
        // require(L2_DAPP != address(0));
        Conversation storage conversation = conversations[
            current_conversation_id
        ];
        conversation.author = msg.sender;
        conversation.prompt = prompt;
        conversation.llmSteps = llmSteps;
        conversation.createInstructionTimestamp = block.timestamp;
        cartesiSubmitPrompt(current_conversation_id, llmSteps, prompt);
        emit PromptSent(current_conversation_id, llmSteps, prompt);
        current_conversation_id++;
    }

    function cartesiSubmitPrompt(
        uint256 conversation_id,
        uint256 llmSteps,
        string memory prompt
    ) public {
        bytes memory payload = abi.encode(conversation_id, prompt, llmSteps);
        inputBox.addInput(L2_DAPP, payload);
    }

    function getPromptByConversationId(uint256 conversation_id)
        public
        view
        returns (string memory)
    {
        Conversation storage conversation = conversations[conversation_id];
        return conversation.prompt;
    }

    function announcePromptResponse(
        uint256 conversation_id,
        uint256 iResponse,
        uint256 iSplitResponse,
        string memory splitResponse
    ) public // cartesi runs this one
    {
        // require(msg.sender == L2_DAPP);
        require(
            conversation_id <= current_conversation_id,
            "invalid conversation id, too high"
        );
        Conversation storage conversation = conversations[conversation_id];
        require(
            iResponse <= conversation.responses.length,
            "invalid iResponse"
        );
        if (iResponse == conversation.responses.length) {
            conversation.responses.push();
        }
        require(
            iSplitResponse <= conversation.responses[iResponse].length,
            "invalid iSplitResponse"
        );
        if (iSplitResponse == conversation.responses[iResponse].length) {
            conversation.responses[iResponse].push();
        }
        conversation.responses[iResponse][iSplitResponse] = splitResponse;
        conversation.responseAnnouncedTimestamp = block.timestamp;
        emit PromptResponseAnnounced(
            conversation_id,
            iResponse,
            iSplitResponse,
            splitResponse
        );
    }

    // get conversation id response count
    function getConversationResponseCount(uint256 conversation_id)
        public
        view
        returns (uint256)
    {
        Conversation storage conversation = conversations[conversation_id];
        return conversation.responses.length;
    }

    // get conversation #id response length
    function getConversationResponseLength(
        uint256 conversation_id,
        uint256 index
    ) public view returns (uint256) {
        Conversation storage conversation = conversations[conversation_id];
        return conversation.responses[index].length;
    }

    // get conversation #id response #iResponse #iSplitResponse
    function getConversationResponseByIndex(
        uint256 conversation_id,
        uint256 iResponse,
        uint256 iSplitResponse
    ) public view returns (string memory) {
        Conversation storage conversation = conversations[conversation_id];
        return conversation.responses[iResponse][iSplitResponse];
    }

    // submit rank to a conversation by a user
    function submitRank(uint256 conversation_id, uint256[] memory ranks)
        public
    {
        require(
            conversation_id <= current_conversation_id,
            "Invalid conversation ID"
        );
        Conversation storage conversation = conversations[conversation_id];
        RankSubmission storage submission = conversation.rankSubmissions[
            msg.sender
        ];
        // Check if the user has not already submitted ranks
        if (submission.user == address(0)) {
            submission.user = msg.sender;
            submission.ranks = ranks;
            conversation.rankSubmissionCount++; // Increment the count as this is a new submission
            submission.rankingTimestamp = block.timestamp; // Set rankingTimestamp for the submission
            conversation.usersWhoSubmittedRanks.push(msg.sender); // Add user to the list of users who submitted ranks
            emit RankSubmitted(conversation_id, msg.sender, ranks);
        } else {
            // User has already submitted ranks, update the ranks
            submission.ranks = ranks;
            submission.rankingTimestamp = block.timestamp; // Update rankingTimestamp for the submission
            emit RankSubmitted(conversation_id, msg.sender, ranks);
        }
    }

    // get list of users who submitted ranks for a conversation
    function getUsersWhoSubmittedRanks(uint256 conversation_id)
        public
        view
        returns (address[] memory)
    {
        Conversation storage conversation = conversations[conversation_id];
        return conversation.usersWhoSubmittedRanks; // Return the array of users who submitted ranks
    }

    // get ranks submitted by a user for a conversation
    function getRanksByUser(uint256 conversation_id, address user)
        public
        view
        returns (uint256[] memory)
    {
        Conversation storage conversation = conversations[conversation_id];
        RankSubmission storage submission = conversation.rankSubmissions[user];
        return submission.ranks;
    }

    struct ConversationSummary {
        address author;
        string prompt;
        uint256 llmSteps;
        string[][] responses;
        uint256 rankSubmissionCount;
        address[] usersWhoSubmittedRanks;
        uint256 createInstructionTimestamp;
        uint256 responseAnnouncedTimestamp;
    }

    // Returns all conversations with their data, excluding mappings
    function getAllConversations() public view returns (ConversationSummary[] memory) {
        ConversationSummary[] memory allConversations = new ConversationSummary[](current_conversation_id);
        for (uint256 i = 0; i < current_conversation_id; i++) {
            Conversation storage conversation = conversations[i];
            allConversations[i] = ConversationSummary({
                author: conversation.author,
                prompt: conversation.prompt,
                llmSteps: conversation.llmSteps,
                responses: conversation.responses,
                rankSubmissionCount: conversation.rankSubmissionCount,
                usersWhoSubmittedRanks: conversation.usersWhoSubmittedRanks,
                createInstructionTimestamp: conversation.createInstructionTimestamp,
                responseAnnouncedTimestamp: conversation.responseAnnouncedTimestamp
            });
        }
        return allConversations;
    }

    // Returns the count of conversations that have been created
    function getConversationCount() public view returns (uint256) {
        return current_conversation_id;
    }

    // get a specific rank submitted by a user for a conversation at a given index
    function getRankByUserAtIndex(
        uint256 conversation_id,
        address user,
        uint256 index
    ) public view returns (uint256) {
        Conversation storage conversation = conversations[conversation_id];
        RankSubmission storage submission = conversation.rankSubmissions[user];
        require(index < submission.ranks.length, "Index out of bounds");
        return submission.ranks[index];
    }

    // get conversation by id
    function getConversationById(uint256 conversation_id)
        public
        view
        returns (
            address author,
            string memory prompt,
            uint256 llmSteps,
            string[][] memory responses,
            uint256 rankSubmissionCount,
            mapping(address => RankSubmission) rankSubmissions,
            address[] memory usersWhoSubmittedRanks,
            uint256 createInstructionTimestamp,
            uint256 responseAnnouncedTimestamp
        )
    {
        Conversation storage conversation = conversations[conversation_id];
        return (
            conversation.author,
            conversation.prompt,
            conversation.llmSteps,
            conversation.responses,
            conversation.rankSubmissionCount,
            conversation.rankSubmissions,
            conversation.usersWhoSubmittedRanks,
            conversation.createInstructionTimestamp,
            conversation.responseAnnouncedTimestamp
        );
    }

    event RankSubmitted(uint256 conversation_id, address user, uint256[] ranks);
    event PromptSent(uint256 conversation_id, uint256 llmSteps, string prompt);
    // event PromptSent(uint256 conversation_id, string prompt);
    event PromptResponseAnnounced(
        uint256 conversation_id,
        uint256 iResponse,
        uint256 iSplitResponse,
        string response
    );
}
