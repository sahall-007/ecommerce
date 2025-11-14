

const fruits = ["Apple", "Banana", "Orange", "Grapes", "Strawberry", "Mango", "Pineapple", "Kiwi", "Watermelon", "Cherry"];

let result = fruits.reduce((prev, next) => {
    if(next.length < prev.length){
        prev = next
    }
    return prev
})

console.log("jhdfdj")

console.log(result)