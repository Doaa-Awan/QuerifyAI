//data access code
//Data repository for managing conversation states

// Implementation detail
const conversations = new Map(); //conversationId -> lastResponse

// Exported repository functions
export const conversationRepository = {
  getLastResponse(conversationId) {
    return conversations.get(conversationId);
  },
  setLastResponse(conversationId, response) {
  //store response object for conversation continuity
  conversations.set(conversationId, response);
}
};
