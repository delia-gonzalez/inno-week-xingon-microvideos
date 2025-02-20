import xingonSticker from "./assets/xingon.png";
import { CloudUpload } from "@mui/icons-material";
import "./App.css";
import { Button, styled, TextField } from "@mui/material";

import { fal } from "@fal-ai/client";
import ReactPlayer from "react-player";
import { useState } from "react";

const Card = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const GenerateButton = styled(Button)`
  margin: 10px;
`;

const UploadedImage = styled("img")`
  margin: 10px;
`;

function App() {
  fal.config({
    credentials: import.meta.env.VITE_FAL_KEY,
  });

  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [keypoints, setKeypoints] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [textInput, setTextInput] = useState("");

  const handleTextInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTextInput(event.target.value);
  };

  const uploadPhoto = async () => {
    if (!selectedFile) {
      console.error("No file selected");
      return;
    }

    const blob = await selectedFile.arrayBuffer();
    const file = new File([blob], selectedFile.name, {
      type: selectedFile.type,
    });

    const uploadedImage = await fal.storage.upload(file);
    setProfileImageUrl(uploadedImage);
  };

  const handleGenerateKeypoints = async () => {
    const result = await fal.subscribe("fal-ai/any-llm", {
      input: {
        prompt:
          "Extract 3 key learnings from the following text. Each of the key points should be a short sentence:" +
          textInput.substring(0, 4000),
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    setKeypoints(result.data.output);
  };

  const handleGenerateVideo = async () => {
    const result = await fal.subscribe(
      "fal-ai/luma-dream-machine/ray-2/image-to-video",
      {
        input: {
          prompt:
            "The person in the photo is speaking as if he or she is broadcasting an instagram story. The person in looking directly to the camera and smiling.",
          image_url: profileImageUrl,
          aspect_ratio: "9:16",
          loop: true,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      }
    );

    setVideoUrl(result.data.video.url);
  };

  return (
    <>
      <div>
        <img
          src={xingonSticker}
          className="xingon sticker"
          alt="Xingon logo"
          width="100"
        />
      </div>
      <h1>Create your micro video</h1>
      <Card className="card">
        <TextField
          id="outlined-multiline-static"
          label="Multiline"
          multiline
          rows={4}
          defaultValue="Paste your article here"
          margin="normal"
          fullWidth
          onChange={handleTextInputChange}
        />
        <Button variant="contained" onClick={handleGenerateKeypoints}>
          Extract key points
        </Button>
        {keypoints && <div>{keypoints}</div>}
      </Card>
      <Card className="card">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              setSelectedFile(file);
            }
          }}
        />
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={uploadPhoto}
        >
          Upload profile image
        </Button>
        {profileImageUrl !== "" && (
          <UploadedImage
            src={profileImageUrl}
            alt="uploaded_image"
            width="300px"
          />
        )}
        <GenerateButton variant="contained" onClick={handleGenerateVideo}>
          $$ Generate! $$
        </GenerateButton>
        {videoUrl !== "" && <ReactPlayer url={videoUrl} controls={true} />}
      </Card>
    </>
  );
}

export default App;
