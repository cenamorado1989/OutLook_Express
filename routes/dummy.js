let totalOutboxes = 10,
  conversations = 99;

const getTotalResponses = async () => {
  const result = {
    totalOutboxes,
    conversations
  }
  return result;
};



const myObject = await getTotalResponses();
console.log(myObject.totalOutboxes);