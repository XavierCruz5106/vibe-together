"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

export default function Connect() {
  const [friendSpotifyURI, setFriendSpotifyURI] = useState(""); // Start with an empty string
  const [errorMessage, setErrorMessage] = useState("");

  // Function to handle form submission and add friend
  const handleAddFriend = async (event: React.FormEvent) => {
    event.preventDefault();

    // Check if the input is empty or too short
    if (!friendSpotifyURI || friendSpotifyURI.length < 3) {
      setErrorMessage("Please enter a valid Spotify user ID or username.");
      return;
    }

    try {

      // Send the POST request to add the friend
      const response = await axios.post("/api/friends", {
        friendId: friendSpotifyURI,
      });

      if (response.status === 200) {
        // Friend added successfully, update UI or notify the user
        alert("Friend added!");
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("Failed to add friend. Please check the Spotify URI.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">
        Connect with Friends
      </h1>
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Add a Friend (Spotify URI)
        </h2>
        <form
          className="flex items-center space-x-2"
          onSubmit={handleAddFriend}
        >
          <Input
            type="text"
            placeholder="Enter friend's Spotify username or ID"
            className="flex-grow"
            value={friendSpotifyURI}
            onChange={(e) => setFriendSpotifyURI(e.target.value)}
          />
          <Button type="submit">Add</Button>
        </form>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      </div>
    </div>
  );
}
