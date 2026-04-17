function fetchData(callback){
    console.log("Fetching data ....")
    setTimeout(() => {
        const data = "User Data";
        callback(data)
    }, 2000);
}
fetchData((data) => {
    console.log("data received" , data)
});