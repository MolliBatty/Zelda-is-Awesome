const FAV_KEY = "zelda-favorites";

function getFavorites(){
    try{
        return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    }catch {
        return [];
    }
}
function saveFavorites(favs){
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function toggleFavorite(id){
    const favs = getFavorites();
    const updated = favs.includes(id)
        ? favs.filter(f => f !== id)
        : [...favs, id];
  saveFavorites(updated);
  return updated.includes(id);
}