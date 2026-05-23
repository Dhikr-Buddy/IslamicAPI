from pydantic import BaseModel, Field


class Provenance(BaseModel):
    source_url: str = Field(alias="sourceUrl")
    license: str | None = None
    retrieved_at: str = Field(alias="retrievedAt")


class Ayah(BaseModel):
    id: str
    surah_number: int = Field(alias="surahNumber")
    ayah_number: int = Field(alias="ayahNumber")
    text: dict[str, str]
    provenance: list[Provenance] = Field(default_factory=list)


class Surah(BaseModel):
    number: int
    name: str | None = None
    english_name: str | None = Field(default=None, alias="englishName")
    ayah_count: int | None = Field(default=None, alias="ayahCount")


class Hadith(BaseModel):
    id: str
    collection: str
    book: str | None = None
    number: str | None = None
    text: dict[str, str]
    grade: str | None = None
    provenance: list[Provenance] = Field(default_factory=list)
