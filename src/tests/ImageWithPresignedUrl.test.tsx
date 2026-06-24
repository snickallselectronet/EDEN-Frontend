import { render, screen } from "@testing-library/react";
import ImageWithPresignedUrl from "../components/ImageWithPresignedUrl";

function Harness({ keyName }: { keyName: string }) {
  const { imageUrl, loading, error } = ImageWithPresignedUrl(keyName);
  if (loading) return <div>loading…</div>;
  if (error) return <div role="alert">{String(error)}</div>;
  return <img src={imageUrl} alt="Example image" data-testid="enc-img" />;
}

it("calls helper and renders an <img>", async () => {
  render(<Harness keyName="photos/1.jpg" />);
  const img = await screen.findByRole("img", { name: /example image/i });
  expect(img).toBeInTheDocument();
});
