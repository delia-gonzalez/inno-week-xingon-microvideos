import xingonSticker from "./assets/xingon.png";
import { Assistant, FactCheck, MonetizationOn } from "@mui/icons-material";
import "./App.css";
import { Box, Button, styled, TextField } from "@mui/material";

import { fal } from "@fal-ai/client";
import ReactPlayer from "react-player";
import { useEffect, useRef, useState } from "react";

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

const StyledInput = styled("input")`
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  margin: 10px;
  width: 100%;
  box-sizing: border-box;
`;

function App() {
  fal.config({
    credentials: import.meta.env.VITE_FAL_KEY,
  });

  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [keywords, setKeywords] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [textInput, setTextInput] = useState("");

  const endOfPageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    endOfPageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [profileImageUrl, keywords, videoUrl]);

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

  const handleGenerateKeywords = async () => {
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

    setKeywords(result.data.output);
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
      <Card className="card">
        <img
          src={xingonSticker}
          className="xingon sticker"
          alt="Xingon logo"
          width="100"
        />
        <h1>Create your micro video</h1>
      </Card>
      <Card className="card">
        <h3>Copy here the article you want to summarize:</h3>
        <TextField
          id="outlined-multiline-static"
          label="Insider article"
          multiline
          maxRows={15}
          margin="normal"
          fullWidth
          onChange={handleTextInputChange}
        />
        <Button
          variant="contained"
          startIcon={<Assistant />}
          onClick={handleGenerateKeywords}
        >
          Extract key points
        </Button>
        {keywords && (
          <Box
            component="section"
            sx={{ width: 700, p: 2, border: "1px solid grey", margin: "10px" }}
          >
            {keywords}
          </Box>
        )}
      </Card>
      <Card className="card">
        <h3>Add your profile picture:</h3>
        <StyledInput
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
          startIcon={<FactCheck />}
          onClick={uploadPhoto}
        >
          Check profile image
        </Button>
        {profileImageUrl === "" && (
          <Box
            component="section"
            sx={{
              width: 700,
              p: 2,
              border: "1px solid grey",
              background: "solid grey",
              margin: "10px",
            }}
          >
            Your image should appear here
          </Box>
        )}
        {profileImageUrl !== "" && (
          <UploadedImage
            src={profileImageUrl}
            alt="uploaded_image"
            width="300px"
          />
        )}
        <GenerateButton
          variant="contained"
          onClick={handleGenerateVideo}
          startIcon={<MonetizationOn />}
          endIcon={<MonetizationOn />}
        >
          Generate video!
        </GenerateButton>
        {videoUrl !== "" && (
          <ReactPlayer url={videoUrl} controls={true} ref={scrollToBottom} />
        )}
      </Card>
    </>
  );
}

export default App;
