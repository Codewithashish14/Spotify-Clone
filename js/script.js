console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}
async function getSongs(folder) {
    // Fix the folder path if it's wrong
    folder = folder.replace('zoops', 'songs');
    currFolder = folder;
    
    try {
        let response = await fetch(`/${folder}/`);
        if (response.ok) {
            let text = await response.text();
            let div = document.createElement("div");
            div.innerHTML = text;
            let anchors = div.getElementsByTagName("a");
            songs = [];
            
            for (let index = 0; index < anchors.length; index++) {
                const element = anchors[index];
                if (element.href.includes(".mp3") && !element.href.includes("info.json")) {
                    const url = new URL(element.href);
                    const pathParts = url.pathname.split('/');
                    const fileName = pathParts[pathParts.length - 1];
                    // Avoid duplicate songs
                    if (!songs.includes(fileName)) {
                        songs.push(fileName);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error loading songs:", error);
    }
    
    // Show all the songs in the playlist
    let songList = document.querySelector(".songList");
    if (!songList) {
        console.error("Song list container not found");
        return songs;
    }
    
    let songUL = songList.querySelector("ul");
    if (!songUL) {
        songUL = document.createElement("ul");
        songList.appendChild(songUL);
    }
    
    songUL.innerHTML = "";
    for (const song of songs) {
        const displayName = decodeURIComponent(song).replace(/\.mp3$/i, '');
        songUL.innerHTML += `<li>
            <img class="invert" width="34" src="img/music.svg" alt="">
            <div class="info">
                <div>${displayName}</div>
                <div>Ashish_Singh</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    // Attach event listener to each song
    Array.from(songUL.querySelectorAll("li")).forEach(e => {
        e.addEventListener("click", () => {
            const songDiv = e.querySelector(".info div:first-child");
            const songText = songDiv.textContent;
            
            // Find the exact song filename
            const exactSongName = songs.find(s => {
                const decodedSong = decodeURIComponent(s).replace(/\.mp3$/i, '');
                return decodedSong === songText;
            });
            
            if (exactSongName) {
                playMusic(exactSongName);
                
                // Add playing indicator
                document.querySelectorAll('.songList li').forEach(li => {
                    li.classList.remove('playing');
                });
                e.classList.add('playing');
            }
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    if (!track) return;
    
    // Fix the folder path if it's wrong
    currFolder = currFolder.replace('zoops', 'songs');
    // Do NOT double-encode the track name
    currentSong.src = `/${currFolder}/${track}`;
    
    console.log("Playing:", currentSong.src);
    
    if (!pause) {
        currentSong.play().catch(error => {
            console.error("Play error:", error);
        });
        const playBtn = document.getElementById("play");
        if (playBtn) playBtn.src = "img/pause.svg";
    }
    
    const songInfo = document.querySelector(".song-info");
    if (songInfo) songInfo.textContent = decodeURIComponent(track).replace(/\.mp3$/i, '');
    
    const songTime = document.querySelector(".song-time");
    if (songTime) songTime.textContent = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("displaying albums");
    
    const albumFolders = ["ncs", "cs", "Soft Bhajans"];
    
    // Find card container
    let cardContainer = document.querySelector(".card-container");
    if (!cardContainer) {
        cardContainer = document.querySelector(".cardContainer");
    }
    if (!cardContainer) {
        console.error("Card container not found");
        return;
    }
    
    cardContainer.innerHTML = "";
    
    for (const folder of albumFolders) {
        try {
            // Load album metadata from info.json
            let metadataResponse = await fetch(`/songs/${folder}/info.json`);
            if (metadataResponse.ok) {
                let metadata = await metadataResponse.json();
                
                cardContainer.innerHTML += `
                <div data-folder="songs/${folder}" class="card">
                    <div class="play-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="${metadata.title}" onerror="this.src='img/default-cover.jpg'">
                    <h3>${metadata.title}</h3>
                    <p>${metadata.description}</p>
                </div>`;
            } else {
                throw new Error('info.json not found');
            }
        } catch (error) {
            console.warn(`Error loading album ${folder}:`, error);
            // Fallback if info.json doesn't exist
            let displayName = folder.replaceAll("%20", " ");
            if (displayName === "Soft Bhajans") {
                displayName = "Soft Bhajans";
            }
            
            cardContainer.innerHTML += `
            <div data-folder="songs/${folder}" class="card">
                <div class="play-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg" alt="${displayName}" onerror="this.src='img/default-cover.jpg'">
                <h3>${displayName}</h3>
                <p>Music collection</p>
            </div>`;
        }
    }

    // Load the playlist whenever card is clicked
    Array.from(document.querySelectorAll(".card")).forEach(card => {
        card.addEventListener("click", async (event) => {
            const folder = card.dataset.folder;
            console.log("Fetching Songs from", folder);
            songs = await getSongs(folder);
            if (songs.length > 0) {
                playMusic(songs[0]);
                
                // Add active class to the clicked card
                document.querySelectorAll('.card').forEach(c => {
                    c.classList.remove('active');
                });
                card.classList.add('active');
            }
        });
    });
}

async function main() {
    console.log("Initializing application");
    
    // Display albums first
    await displayAlbums();
    
    // Then try to load songs from the first album
    try {
        await getSongs("songs/ncs");
        if (songs.length > 0) {
            playMusic(songs[0], true);
        }
    } catch (error) {
        console.warn("Could not load songs:", error);
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");
    const hamburger = document.querySelector(".hamburger");
    const closeBtn = document.querySelector(".close");
    const seekbar = document.querySelector(".seekbar");
    const volumeInput = document.querySelector(".range input");
    const volumeImg = document.querySelector(".volume img");

    // Auto-play next song when current song ends
    currentSong.addEventListener('ended', function() {
        if (songs.length === 0) return;
        
        const currentTrack = decodeURIComponent(currentSong.src.split("/").pop() || "");
        let index = songs.indexOf(currentTrack);
        if (index === -1) index = 0;
        
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            // If it's the last song, play the first one
            playMusic(songs[0]);
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        const songTime = document.querySelector(".song-time");
        if (songTime && currentSong.duration) {
            const currentTime = secondsToMinutesSeconds(currentSong.currentTime);
            const totalTime = secondsToMinutesSeconds(currentSong.duration);
            songTime.textContent = `${currentTime} / ${totalTime}`;
        }
        
        const circle = document.querySelector(".circle");
        if (circle && currentSong.duration) {
            circle.style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    if (play) {
        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play().catch(console.error);
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/play.svg";
            }
        });
    }

    if (seekbar) {
        seekbar.addEventListener("click", (e) => {
            if (currentSong.duration) {
                const rect = seekbar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width * 100;
                const circle = document.querySelector(".circle");
                if (circle) circle.style.left = percent + "%";
                currentSong.currentTime = (currentSong.duration * percent) / 100;
            }
        });
    }

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });
    }

    if (previous) {
        previous.addEventListener("click", () => {
            if (songs.length === 0) return;
            
            const currentTrack = decodeURIComponent(currentSong.src.split("/").pop() || "");
            let index = songs.indexOf(currentTrack);
            if (index === -1) index = 0;
            
            if (index - 1 >= 0) {
                playMusic(songs[index - 1]);
            } else {
                playMusic(songs[songs.length - 1]);
            }
        });
    }

    if (next) {
        next.addEventListener("click", () => {
            if (songs.length === 0) return;
            
            const currentTrack = decodeURIComponent(currentSong.src.split("/").pop() || "");
            let index = songs.indexOf(currentTrack);
            if (index === -1) index = 0;
            
            if (index + 1 < songs.length) {
                playMusic(songs[index + 1]);
            } else {
                playMusic(songs[0]);
            }
        });
    }

    if (volumeInput) {
        volumeInput.addEventListener("input", (e) => {
            currentSong.volume = parseInt(e.target.value) / 100;
            if (volumeImg) {
                volumeImg.src = currentSong.volume > 0 ? "img/volume.svg" : "img/mute.svg";
            }
        });
    }

    if (volumeImg) {
        volumeImg.addEventListener("click", () => {
            if (currentSong.volume > 0) {
                currentSong.volume = 0;
                volumeImg.src = "img/mute.svg";
                if (volumeInput) volumeInput.value = 0;
            } else {
                currentSong.volume = 0.5;
                volumeImg.src = "img/volume.svg";
                if (volumeInput) volumeInput.value = 50;
            }
        });
    }
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', main);

// Ensure this file exists and is a supported format
audio.src = "songs/song1.mp3";