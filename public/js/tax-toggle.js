let taxToggle = document.getElementById("switchCheckDefault");
taxToggle.addEventListener("click", () => {
    let taxInfo = document.getElementsByClassName("tax-info");
    for(info of taxInfo) {
        if(info.style.display != "inline") {
            info.style.display = "inline";
        } else {
        info.style.display = "none";
    }
}});