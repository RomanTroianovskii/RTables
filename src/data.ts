import { Table } from "./Utils/SQLUtils";

export let CurrentUser = {
    username: localStorage.getItem("username"),
    pass: localStorage.getItem("pass")
}


export let first: string = localStorage.getItem("prev1") || "null";
export let second: string = localStorage.getItem("prev2") || "null";
export let third: string = localStorage.getItem("prev3") || "null";

export const setStorage = (_first: string, _second: string, _third: string) => {
    first = _first;
    second = _second;
    third = _third;
}

export const getStorage = () => {
    return {
        first: first,
        second: second,
        third: third
    }
}

export const setStorageByHref = (href: string) => {
    const first = localStorage.getItem("prev1") || "null";
    const second = localStorage.getItem("prev2") || "null";
    const third = localStorage.getItem("prev3") || "null";
    console.log(first)
    console.log(second)
    if(first == null || first == "null")
    {
      localStorage.setItem("prev1", href)
    }
    else if(second == null || second == "null" && first != href)
    {
      localStorage.setItem("prev1", href)
      localStorage.setItem("prev2", first)
    }
    else if(first != href && second != href && third != href)
    {
      localStorage.setItem("prev1", href)
      localStorage.setItem("prev2", first)
      localStorage.setItem("prev3", second)
    }
  }
export const SetCurrentUser = () => {
    CurrentUser.username = localStorage.getItem("username");
    CurrentUser.pass = localStorage.getItem("pass");
}